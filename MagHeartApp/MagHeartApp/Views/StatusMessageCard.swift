import SwiftUI

struct StatusMessageCard: View {
    let message: String
    
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: iconName)
                .font(.callout)
                .foregroundColor(iconColor)
            
            Text(message)
                .font(.callout)
                .foregroundColor(.secondary)
            
            Spacer()
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(backgroundColor)
        )
    }
    
    private var iconName: String {
        if message.contains("denied") || message.contains("Permission") {
            return "exclamationmark.triangle.fill"
        } else if message.contains("Ready") || message.contains("Uploaded") {
            return "checkmark.circle.fill"
        } else {
            return "info.circle.fill"
        }
    }
    
    private var iconColor: Color {
        if message.contains("denied") || message.contains("Permission") {
            return .orange
        } else if message.contains("Ready") || message.contains("Uploaded") {
            return .green
        } else {
            return .blue
        }
    }
    
    private var backgroundColor: Color {
        if message.contains("denied") || message.contains("Permission") {
            return Color.orange.opacity(0.1)
        } else if message.contains("Ready") || message.contains("Uploaded") {
            return Color.green.opacity(0.1)
        } else {
            return Color(.tertiarySystemBackground)
        }
    }
}


