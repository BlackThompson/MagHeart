import Foundation
import Combine

final class AppSettings: ObservableObject {
    static let shared = AppSettings()
    private init() {
        // Load persisted values or defaults
        backendURLString = UserDefaults.standard.string(forKey: Keys.backendURL) ?? ""
        userId = UserDefaults.standard.string(forKey: Keys.userId) ?? "demo"
        uploadDirectFallback = UserDefaults.standard.object(forKey: Keys.uploadDirectFallback) as? Bool ?? false
    }
    
    private enum Keys {
        static let backendURL = "AppSettings.backendURL"
        static let userId = "AppSettings.userId"
        static let uploadDirectFallback = "AppSettings.uploadDirectFallback"
    }
    
    @Published var backendURLString: String {
        didSet {
            UserDefaults.standard.set(backendURLString, forKey: Keys.backendURL)
        }
    }
    
    @Published var userId: String {
        didSet {
            UserDefaults.standard.set(userId, forKey: Keys.userId)
        }
    }
    
    @Published var uploadDirectFallback: Bool {
        didSet {
            UserDefaults.standard.set(uploadDirectFallback, forKey: Keys.uploadDirectFallback)
        }
    }
    
    var backendURL: URL? {
        URL(string: backendURLString)
    }
    
    var isBackendURLValid: Bool {
        guard let url = backendURL else { return false }
        return url.scheme == "https" && url.host != nil
    }
}


