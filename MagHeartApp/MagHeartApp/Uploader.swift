import Foundation

final class Uploader {
    static let shared = Uploader()
    private init() {}

    func postHeartRate(_ payload: HeartRatePayload) {
        let url = Config.backendBaseURL.appendingPathComponent("/api/heart_rate")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(Config.userId, forHTTPHeaderField: "X-User-Id")
        do { req.httpBody = try JSONEncoder().encode(payload) } catch { return }

        let task = URLSession.shared.dataTask(with: req) { _, resp, err in
            if let err = err { print("[Uploader] error: \(err)"); return }
            if let http = resp as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                print("[Uploader] http status: \(http.statusCode)")
                return
            }
            NotificationCenter.default.post(name: .didUploadHeartRate, object: nil, userInfo: ["bpm": payload.bpm])
        }
        task.resume()
    }
}

extension Notification.Name {
    static let didUploadHeartRate = Notification.Name("didUploadHeartRate")
}

