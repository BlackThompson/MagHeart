import Foundation

final class WatchSettings {
    static let shared = WatchSettings()
    private init() {
        backendURLString = UserDefaults.standard.string(forKey: Keys.backendURL) ?? ""
        userId = UserDefaults.standard.string(forKey: Keys.userId) ?? "demo"
        uploadDirectFallback = UserDefaults.standard.object(forKey: Keys.uploadDirectFallback) as? Bool ?? false
    }
    
    private enum Keys {
        static let backendURL = "WatchSettings.backendURL"
        static let userId = "WatchSettings.userId"
        static let uploadDirectFallback = "WatchSettings.uploadDirectFallback"
    }
    
    var backendURLString: String {
        didSet { UserDefaults.standard.set(backendURLString, forKey: Keys.backendURL) }
    }
    var userId: String {
        didSet { UserDefaults.standard.set(userId, forKey: Keys.userId) }
    }
    var uploadDirectFallback: Bool {
        didSet { UserDefaults.standard.set(uploadDirectFallback, forKey: Keys.uploadDirectFallback) }
    }
    
    var backendURL: URL? {
        URL(string: backendURLString)
    }
    
    func apply(context: [String: Any]) {
        if let urlStr = context["backendURL"] as? String {
            backendURLString = urlStr
        }
        if let uid = context["userId"] as? String {
            userId = uid
        }
        if let direct = context["uploadDirectFallback"] as? Bool {
            uploadDirectFallback = direct
        }
        print("[WatchSettings] Applied context: \(context)")
    }
}


