import SwiftUI

private var isPreviewRunning: Bool {
    #if DEBUG
    return ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] == "1"
    #else
    return false
    #endif
}

struct HRPhoneView: View {
    @StateObject private var appSettings = AppSettings.shared
    @StateObject private var watchManager = WatchSessionManager.shared
    @State private var lastBpm: Int? = nil
    @State private var status: String = ""

    var body: some View {
        NavigationView {
            ZStack {
                Color(.systemBackground)
                    .ignoresSafeArea()
                
                VStack(spacing: 20) {
                    Spacer()
                    
                    // Heart rate display card
                    HeartCardView(bpm: displayedBpm)
                    .padding(.horizontal, 24)
                    
                    Spacer()
                    
                    if shouldShowUploadedCard {
                        StatusMessageCard(message: displayedStatus)
                            .padding(.horizontal, 24)
                    }
                    
                    Spacer()
                }
            }
            .navigationTitle("MagHeart")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            if isPreviewRunning {
                // Skip system services in SwiftUI previews; show mock data
                status = "Uploaded: 72 BPM"
                lastBpm = 72
            } else {
                // Start watch session manager
                WatchSessionManager.shared.start()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .didUploadHeartRate)) { note in
            if let bpm = note.userInfo?["bpm"] as? Int { lastBpm = bpm }
            status = "Uploaded: \(lastBpm ?? 0) BPM"
        }
    }

    private var displayedBpm: Int? {
        if appSettings.isUITestModeEnabled {
            return 75
        }
        return lastBpm
    }

    private var displayedStatus: String {
        if appSettings.isUITestModeEnabled {
            return "Uploaded: 75 BPM"
        }
        return status
    }
    
    private var shouldShowUploadedCard: Bool {
        guard !displayedStatus.isEmpty else { return false }
        return displayedStatus.lowercased().hasPrefix("uploaded")
    }
}

#Preview { HRPhoneView() }
