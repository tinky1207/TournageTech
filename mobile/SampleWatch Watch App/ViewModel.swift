//
//  ViewModel.swift
//  SampleWatch Watch App
//

import Foundation
import WatchConnectivity
import CoreMotion
import HealthKit
import CoreLocation
import SwiftUI
import Combine

class ViewModel: NSObject, ObservableObject, WCSessionDelegate, CLLocationManagerDelegate {
    var objectWillChange = ObservableObjectPublisher()
    
    let motionManager = CMMotionManager()
    let healthStore = HKHealthStore()
    let locationManager = CLLocationManager()
    var workoutSession: HKWorkoutSession?
    var timer: Timer? // For periodic calorie queries
    var heartRateQuery: HKAnchoredObjectQuery? // To stop later if needed
    
    override init() {
        super.init()
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
        locationManager.delegate = self
    }
    
    // Required delegates
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    
    // Receive commands from phone
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        if let command = message["command"] as? String {
            switch command {
            case "start_accel":
                startAccel()
            case "stop_accel":
                stopAccel()
            case "start_gyro":
                startGyro()
            case "stop_gyro":
                stopGyro()
            case "start_heart":
                startHeartRate()
            case "stop_heart":
                stopHeartRate()
            case "start_calorie":
                startCalories()
            case "stop_calorie":
                stopCalories()
            case "start_gps":
                startGPS()
            case "stop_gps":
                stopGPS()
            default:
                break
            }
        }
    }
    
    // Accelerometer
    func startAccel() {
        if motionManager.isAccelerometerAvailable {
            motionManager.accelerometerUpdateInterval = 0.1
            motionManager.startAccelerometerUpdates(to: .main) { data, error in
                guard let data = data else { return }
                WCSession.default.sendMessage(["type": "accel", "x": data.acceleration.x, "y": data.acceleration.y, "z": data.acceleration.z], replyHandler: nil)
            }
        }
    }
    
    func stopAccel() {
        motionManager.stopAccelerometerUpdates()
    }
    
    // Gyroscope
    func startGyro() {
        if motionManager.isGyroAvailable {
            motionManager.gyroUpdateInterval = 0.1
            motionManager.startGyroUpdates(to: .main) { data, error in
                guard let data = data else { return }
                WCSession.default.sendMessage(["type": "gyro", "x": data.rotationRate.x, "y": data.rotationRate.y, "z": data.rotationRate.z], replyHandler: nil)
            }
        }
    }
    
    func stopGyro() {
        motionManager.stopGyroUpdates()
    }
    
    // Heart Rate (Requires HealthKit permission)
    func startHeartRate() {
        authorizeHealthKit { success in
            if success {
                let configuration = HKWorkoutConfiguration()
                configuration.activityType = .running // Adjust as needed
                do {
                    self.workoutSession = try HKWorkoutSession(healthStore: self.healthStore, configuration: configuration)
                    self.workoutSession?.startActivity(with: Date())
                    self.executeHeartRateQuery()
                } catch {
                    print("Error starting workout: \(error)")
                }
            }
        }
    }
    
    func executeHeartRateQuery() {
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let predicate = HKQuery.predicateForSamples(withStart: Date.distantPast, end: Date(), options: .strictEndDate)
        
        // Define a shared handler with the full closure type (expanded from HKAnchoredObjectQueryHandler)
        let handler: (HKAnchoredObjectQuery, [HKSample]?, [HKDeletedObject]?, HKQueryAnchor?, Error?) -> Void = { [weak self] query, samples, deleted, newAnchor, error in
            guard let _ = self else { return }
            if let error = error {
                print("Heart rate query error: \(error)")
                return
            }
            if let sample = samples?.last as? HKQuantitySample {
                let bpm = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                WCSession.default.sendMessage(["type": "heart", "bpm": bpm], replyHandler: nil)
            }
        }
        
        let query = HKAnchoredObjectQuery(type: heartRateType, predicate: predicate, anchor: nil, limit: HKObjectQueryNoLimit, resultsHandler: handler)
        query.updateHandler = handler // Enable real-time updates
        
        healthStore.execute(query)
        self.heartRateQuery = query // Store to stop later
    }
    
    func stopHeartRate() {
        workoutSession?.end()
        if let query = heartRateQuery {
            healthStore.stop(query)
            heartRateQuery = nil
        }
    }
    
    // Calories (Active Energy Burned via HealthKit)
    func startCalories() {
        authorizeHealthKit { success in
            if success {
                // Start workout as in heart rate
                let configuration = HKWorkoutConfiguration()
                configuration.activityType = .running
                do {
                    self.workoutSession = try HKWorkoutSession(healthStore: self.healthStore, configuration: configuration)
                    self.workoutSession?.startActivity(with: Date())
                    self.timer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { _ in // Query every 10s
                        self.queryCalories()
                    }
                } catch {
                    print("Error: \(error)")
                }
            }
        }
    }
    
    func queryCalories() {
        let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
        let predicate = HKQuery.predicateForSamples(withStart: workoutSession?.startDate, end: Date(), options: .strictStartDate)
        let query = HKStatisticsQuery(quantityType: energyType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
            let calories = result?.sumQuantity()?.doubleValue(for: HKUnit.kilocalorie()) ?? 0
            WCSession.default.sendMessage(["type": "calorie", "value": calories], replyHandler: nil)
        }
        healthStore.execute(query)
    }
    
    func stopCalories() {
        timer?.invalidate()
        workoutSession?.end()
    }
    
    // GPS
    func startGPS() {
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if let location = locations.last {
            WCSession.default.sendMessage(["type": "gps", "lat": location.coordinate.latitude, "lon": location.coordinate.longitude], replyHandler: nil)
        }
    }
    
    func stopGPS() {
        locationManager.stopUpdatingLocation()
    }
    
    // HealthKit Authorization (Runtime Permission)
    private func authorizeHealthKit(completion: @escaping (Bool) -> Void) {
        let types: Set = [
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
        ]
        healthStore.requestAuthorization(toShare: types, read: types) { success, error in
            completion(success)
        }
    }
}
