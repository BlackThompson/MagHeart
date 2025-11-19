import Foundation

final class Uploader {
    static let shared = Uploader()
    private init() {}

    func postHeartRate(_ payload: HeartRatePayload) {
        let baseURL = AppSettings.shared.isBackendURLValid ? (AppSettings.shared.backendURL ?? Config.backendBaseURL) : Config.backendBaseURL
        let userId = AppSettings.shared.userId.isEmpty ? "demo" : AppSettings.shared.userId
        let url = baseURL.appendingPathComponent("/api/heart_rate")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(userId, forHTTPHeaderField: "X-User-Id")
        do { req.httpBody = try JSONEncoder().encode(payload) } catch { return }

        let task = URLSession.shared.dataTask(with: req) { _, resp, err in
            if let err = err { print("[Uploader] error: \(err)"); return }
            if let http = resp as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                print("[Uploader] http status: \(http.statusCode)")
                return
            }
            DispatchQueue.main.async {
                NotificationCenter.default.post(name: .didUploadHeartRate, object: nil, userInfo: ["bpm": payload.bpm])
            }
        }
        task.resume()
    }
    
    func healthCheck(completion: ((Bool, Int?) -> Void)? = nil) {
        let baseURL = AppSettings.shared.isBackendURLValid ? (AppSettings.shared.backendURL ?? Config.backendBaseURL) : Config.backendBaseURL
        var req = URLRequest(url: baseURL)
        req.httpMethod = "GET"
        URLSession.shared.dataTask(with: req) { _, resp, err in
            if let err = err {
                print("[Uploader] healthCheck error: \(err.localizedDescription)")
                completion?(false, nil)
                return
            }
            if let http = resp as? HTTPURLResponse {
                completion?((200...299).contains(http.statusCode), http.statusCode)
            } else {
                completion?(false, nil)
            }
        }.resume()
    }
}

extension Notification.Name {
    static let didUploadHeartRate = Notification.Name("didUploadHeartRate")
}

