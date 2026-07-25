import Foundation
import Combine

final class WatchSettings: ObservableObject {
    static let shared = WatchSettings()
    private init() {
        backendURLString = UserDefaults.standard.string(forKey: Keys.backendURL) ?? WatchConfig.backendBaseURL.absoluteString
        userId = UserDefaults.standard.string(forKey: Keys.userId) ?? WatchConfig.userId
        isUITestModeEnabled = UserDefaults.standard.bool(forKey: Keys.uiTestMode)
    }
    
    private enum Keys {
        static let backendURL = "WatchSettings.backendURL"
        static let userId = "WatchSettings.userId"
        static let uiTestMode = "WatchSettings.uiTestMode"
    }
    
    @Published var backendURLString: String {
        didSet { UserDefaults.standard.set(backendURLString, forKey: Keys.backendURL) }
    }
    @Published var userId: String {
        didSet { UserDefaults.standard.set(userId, forKey: Keys.userId) }
    }
    @Published var isUITestModeEnabled: Bool {
        didSet { UserDefaults.standard.set(isUITestModeEnabled, forKey: Keys.uiTestMode) }
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
        print("[WatchSettings] Applied context: \(context)")
    }
}
