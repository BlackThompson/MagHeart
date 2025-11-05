import Foundation
import WatchConnectivity

final class WatchSessionManager: NSObject, WCSessionDelegate {
    static let shared = WatchSessionManager()
    private override init() { super.init() }

    func start() {
        guard WCSession.isSupported() else { return }
        let s = WCSession.default
        s.delegate = self
        s.activate()
    }

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        print("[WC iOS] activation: \(activationState.rawValue) err: \(String(describing: error))")
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { WCSession.default.activate() }

    func session(_ session: WCSession, didReceiveMessageData messageData: Data) {
        if let payload = try? JSONDecoder().decode(HeartRatePayload.self, from: messageData) {
            Uploader.shared.postHeartRate(payload)
        }
    }
}

