import SwiftUI

struct WatchConnectionStatusCard: View {
    @ObservedObject var watchManager: WatchSessionManager
    @Environment(\.openURL) private var openURL
    
    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: statusIcon)
                .font(.title3)
                .foregroundColor(statusColor)
                .frame(width: 36, height: 36)
                .background(
                    Circle()
                        .fill(statusColor.opacity(0.12))
                )
            
            VStack(alignment: .leading, spacing: 2) {
                Text(statusTitle)
                    .font(.callout)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text(statusDescription)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(16)
        .contentShape(Rectangle())
        .onTapGesture {
            if let url = URL(string: "itms-watchs://") {
                openURL(url)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.secondarySystemBackground))
        )
    }
    
    private var statusIcon: String {
        if !watchManager.isWatchAppInstalled {
            return "applewatch.slash"
        } else if !watchManager.isReachable {
            return "applewatch"
        } else {
            return "applewatch.radiowavesforward.and.backward"
        }
    }
    
    private var statusColor: Color {
        if !watchManager.isWatchAppInstalled {
            return .orange
        } else if !watchManager.isReachable {
            return .blue
        } else {
            return .green
        }
    }
    
    private var statusTitle: String {
        if !watchManager.isWatchAppInstalled {
            return "Not Installed"
        } else if !watchManager.isReachable {
            return "Disconnected"
        } else {
            return "Connected"
        }
    }
    
    private var statusDescription: String {
        if !watchManager.isWatchAppInstalled {
            return "Install from Watch app"
        } else if !watchManager.isReachable {
            return "Open Watch app"
        } else {
            return "Ready to receive data"
        }
    }
}


