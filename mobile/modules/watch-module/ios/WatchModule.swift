import ExpoModulesCore
import WatchConnectivity

public class WatchModule: Module {
  let receiver = Receiver()

  public func definition() -> ModuleDefinition {
    Name("WatchModule")

    Events("onChange")

    Function("startListening") {
      receiver.registerSendEventCallback(sendEventCallback: self.sendEvent)
    }

    Function("disableListening") {
      receiver.disableListening()
    }

    Function("send") { (message: [String: Any]) in
      WCSession.default.sendMessage(message, replyHandler: nil)
    }
  }
}