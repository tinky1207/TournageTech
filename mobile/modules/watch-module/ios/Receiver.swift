import Foundation
import WatchConnectivity

typealias SendEventType = (_ eventName: String, _ body: [String: Any?]) -> Void

class Receiver: NSObject, WCSessionDelegate {

  var sendEventCallback: SendEventType? = nil
  var isListening = true;

  override init() {
    super.init()
    // Set this class as the watch delegate
    WCSession.default.delegate = self
    // Start the session with the Watch
    WCSession.default.activate()
  }

  /// Register a callback to send data to RN
  func registerSendEventCallback(sendEventCallback: @escaping SendEventType) {
    isListening = true
    self.sendEventCallback = sendEventCallback
  }

  func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
    print(message)
  }

  /// Send an event to RN when new data comes in
  func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
    if(isListening) {
      self.sendEventCallback?("onChange", message)
    }
  }

  // Disable listening for accelerometer data
  func disableListening() {
    isListening = false;
  }

  // Junk drawer of methods required for the app to compile
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
  func sessionDidBecomeInactive(_ session: WCSession) {}
  func sessionDidDeactivate(_ session: WCSession) {}
}
