import SwiftUI

struct StatusInfoView: View {
    let status: String
    let backendStatus: String
    let isRunning: Bool
    
    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                // Header
                Text("Status")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 8)
                
                // App Status Card
                StatusCard(
                    icon: statusIcon,
                    title: "App Status",
                    value: status,
                    color: statusColor
                )
                
                // Backend Status Card
                StatusCard(
                    icon: backendStatus.contains("OK") ? "checkmark.circle.fill" : "xmark.circle.fill",
                    title: "Backend",
                    value: backendStatus,
                    color: backendStatus.contains("OK") ? .green : .orange
                )
                
                // Monitoring State Card
                StatusCard(
                    icon: isRunning ? "waveform.path.ecg" : "pause.circle",
                    title: "Monitoring",
                    value: isRunning ? "Active" : "Paused",
                    color: isRunning ? .green : .secondary
                )
            }
            .padding(.horizontal)
        }
    }
    
    private var statusIcon: String {
        if status.contains("denied") {
            return "exclamationmark.triangle.fill"
        } else if status.contains("Ready") {
            return "checkmark.circle.fill"
        } else {
            return "info.circle"
        }
    }
    
    private var statusColor: Color {
        if status.contains("denied") {
            return .orange
        } else if status.contains("Ready") {
            return .green
        } else {
            return .blue
        }
    }
}

private struct StatusCard: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.footnote)
                    .foregroundColor(color)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text(value)
                .font(.callout)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.08))
        )
    }
}


