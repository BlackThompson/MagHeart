import SwiftUI
import WatchConnectivity
import UIKit

struct SettingsView: View {
    @StateObject private var appSettings = AppSettings.shared
    @StateObject private var watchManager = WatchSessionManager.shared
    
    @State private var urlInput: String = ""
    @State private var userIdInput: String = ""
    @State private var uploadDirect: Bool = false
    
    @State private var healthCheckResult: String = ""
    @State private var isTesting: Bool = false
    @State private var showingSyncSuccess: Bool = false
    
    private var isValidURL: Bool {
        guard let url = URL(string: urlInput), url.scheme == "https", url.host != nil else { return false }
        return true
    }
    
    var body: some View {
        NavigationView {
            Form {
                // Backend Configuration Section
                Section {
                    HStack(spacing: 12) {
                        Image(systemName: "server.rack")
                            .foregroundColor(.blue)
                            .frame(width: 28)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Backend URL")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            TextField("https://your-ngrok.ngrok-free.app", text: $urlInput)
                                .textInputAutocapitalization(.never)
                                .keyboardType(.URL)
                                .autocorrectionDisabled(true)
                                .font(.body)
                        }
                    }
                    
                    if !isValidURL && !urlInput.isEmpty {
                        Label("Please enter a valid https URL", systemImage: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                    
                    HStack(spacing: 12) {
                        Image(systemName: "person.fill")
                            .foregroundColor(.purple)
                            .frame(width: 28)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("User ID")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            TextField("User ID", text: $userIdInput)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled(true)
                                .font(.body)
                        }
                    }
                    
                    Toggle(isOn: $uploadDirect) {
                        HStack(spacing: 12) {
                            Image(systemName: "applewatch")
                                .foregroundColor(.orange)
                                .frame(width: 28)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Direct Upload")
                                    .font(.body)
                                Text("Upload from Watch when iPhone unreachable")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    
                    // Action buttons
                    HStack(spacing: 12) {
                        Button {
                            applySettings()
                        } label: {
                            Label("Save", systemImage: "checkmark.circle.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .disabled(!isValidURL || userIdInput.isEmpty)
                        
                        Button {
                            testBackend()
                        } label: {
                            if isTesting {
                                ProgressView()
                                    .frame(maxWidth: .infinity)
                            } else {
                                Label("Test", systemImage: "network")
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .buttonStyle(.bordered)
                        .tint(.blue)
                        .disabled(!isValidURL || isTesting)
                    }
                    
                    if !healthCheckResult.isEmpty {
                        HStack(spacing: 8) {
                            Image(systemName: healthCheckResult.contains("reachable") ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundColor(healthCheckResult.contains("reachable") ? .green : .red)
                            Text(healthCheckResult)
                                .font(.caption)
                        }
                    }
                } header: {
                    Label("Backend Configuration", systemImage: "gearshape.2.fill")
                }
                
                // Watch Status Section
                Section {
                    StatusRow(
                        icon: "applewatch",
                        iconColor: .blue,
                        title: "Watch App",
                        value: watchManager.isWatchAppInstalled ? "Installed" : "Not Installed",
                        valueColor: watchManager.isWatchAppInstalled ? .green : .orange
                    )
                    
                    StatusRow(
                        icon: "antenna.radiowaves.left.and.right",
                        iconColor: .green,
                        title: "Connection",
                        value: watchManager.isReachable ? "Connected" : "Disconnected",
                        valueColor: watchManager.isReachable ? .green : .secondary
                    )
                    
                    StatusRow(
                        icon: "power",
                        iconColor: .purple,
                        title: "Activation",
                        value: activationStatusText,
                        valueColor: watchManager.activationState == .activated ? .green : .secondary
                    )
                    
                    Button {
                        watchManager.syncSettingsToWatch()
                        withAnimation {
                            showingSyncSuccess = true
                        }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            withAnimation {
                                showingSyncSuccess = false
                            }
                        }
                    } label: {
                        HStack {
                            Image(systemName: showingSyncSuccess ? "checkmark.circle.fill" : "arrow.triangle.2.circlepath")
                                .foregroundColor(showingSyncSuccess ? .green : .blue)
                            Text(showingSyncSuccess ? "Synced!" : "Sync to Watch")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(.blue)
                    .disabled(!isValidURL || !watchManager.isWatchAppInstalled)
                } header: {
                    Label("Watch Status", systemImage: "applewatch.watchface")
                }
                
                // Device Info Section
                Section {
                    InfoRow(icon: "iphone", iconColor: .blue, title: "Device", value: UIDevice.current.name)
                    InfoRow(icon: "square.stack.3d.up.fill", iconColor: .orange, title: "Model", value: UIDevice.current.model)
                    InfoRow(icon: "apps.iphone", iconColor: .purple, title: "iOS Version", value: UIDevice.current.systemVersion)
                } header: {
                    Label("Device Information", systemImage: "info.circle.fill")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
        }
        .onAppear {
            urlInput = appSettings.backendURLString
            userIdInput = appSettings.userId
            uploadDirect = appSettings.uploadDirectFallback
            // ensure watch status refresh
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                watchManager.checkWatchAppStatus()
            }
        }
    }
    
    private var activationStatusText: String {
        switch watchManager.activationState {
        case .activated:
            return "Activated"
        case .inactive:
            return "Inactive"
        case .notActivated:
            return "Not Activated"
        @unknown default:
            return "Unknown"
        }
    }
    
    private func applySettings() {
        appSettings.backendURLString = urlInput
        appSettings.userId = userIdInput
        appSettings.uploadDirectFallback = uploadDirect
        // also push once
        watchManager.syncSettingsToWatch()
    }
    
    private func testBackend() {
        isTesting = true
        healthCheckResult = "Testing..."
        Uploader.shared.healthCheck { ok, status in
            DispatchQueue.main.async {
                self.isTesting = false
                if ok {
                    self.healthCheckResult = "Backend reachable (status \(status ?? 200))"
                } else {
                    self.healthCheckResult = "Backend unreachable\(status != nil ? " (status \(status!))" : "")"
                }
            }
        }
    }
}
