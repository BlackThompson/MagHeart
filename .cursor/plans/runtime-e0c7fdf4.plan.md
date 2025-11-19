<!-- e0c7fdf4-01b0-45a9-bfdb-c17ace81f719 4743f847-2f58-4d52-94fd-c76f26be8d45 -->
# Runtime Settings + Watch Sync

## Summary

Add a Settings page in the iPhone app to configure backend URL, userId, and an optional direct-upload toggle. Persist settings in UserDefaults, use them at runtime (no rebuilds). Sync settings to the Watch via WatchConnectivity application context. Refactor iOS and Watch uploaders to read from runtime settings. Home page shows only heart rate.

## Key Changes

### iPhone (MagHeartApp)

- Create `AppSettings` (singleton ObservableObject) reading/writing UserDefaults: `backendURLString`, `userId`, `uploadDirectFallback`.
- Refactor `Uploader` to compute `baseURL` from `AppSettings.shared.backendURLString` at request time and validate before use.
- Add `SettingsView.swift` (SwiftUI Form):
- TextField for URL (with validation and sample hint)
- TextField for User ID
- Toggle for "Upload directly from Watch when iPhone unreachable"
- Section: Device info (iPhone model/name, iOS version)
- Section: Watch status (paired, installed, reachable, activationState) bound to `WatchSessionManager`
- Buttons: "Test backend" (health check), "Sync to Watch" (sends applicationContext)
- Update `ContentView.swift` to a `TabView` with tabs: Home (`HRPhoneView`) and Settings (`SettingsView`). Keep Home minimal: title + current BPM.
- Update `WatchSessionManager.swift`:
- On activation and when `AppSettings` changes, call `WCSession.default.updateApplicationContext([...])` with `backendURL`, `userId`, `uploadDirectFallback`.
- Expose watch status with `@Published` properties already present; add a `syncSettingsToWatch()` method used by the Settings screen.

### Watch (MagHeartApp Watch App)

- Create `WatchSettings` reading/writing UserDefaults with default fallbacks to current hardcoded values.
- Update `WatchUploader` to read `backendBaseURL` and `userId` from `WatchSettings` at call time.
- In watch `WatchSessionManager` (existing in `ContentView.swift`):
- Implement `session(_:didReceiveApplicationContext:)` to persist incoming `backendURL`, `userId`, `uploadDirectFallback` into `WatchSettings`.
- Log applied settings.

## Data Flow

- User edits URL on iPhone → `AppSettings` saves to UserDefaults → `WatchSessionManager.updateApplicationContext` sends to Watch → Watch saves to `WatchSettings` → subsequent uploads use new URL immediately. No rebuild required.

## Files to Add/Edit

- Add: `[MagHeartApp/MagHeartApp/AppSettings.swift]` (UserDefaults-backed settings)
- Add: `[MagHeartApp/MagHeartApp/SettingsView.swift]` (UI for settings and status)
- Edit: `[MagHeartApp/MagHeartApp/ContentView.swift]` (TabView)
- Edit: `[MagHeartApp/MagHeartApp/Uploader.swift]` (dynamic base URL)
- Edit: `[MagHeartApp/MagHeartApp/WatchSessionManager.swift]` (sync settings)
- Add: `[MagHeartApp/MagHeartApp Watch App/WatchSettings.swift]` (UserDefaults-backed)
- Edit: `[MagHeartApp/MagHeartApp Watch App/WatchUploader.swift]` (dynamic base URL)
- Edit: `[MagHeartApp/MagHeartApp Watch App/ContentView.swift]` (receive app context)

## Implementation Notes

- URL validation: require `https://` and host presence; show inline error and disable Save/Test until valid.
- Backward compatibility: if settings empty, default to current hardcoded URL/userId so nothing breaks.
- Threading: publish changes on main queue; debounce settings sync to Watch to avoid spamming.
- Error handling: show toast/alert on failed health check; log failures.

## Testing

- Change URL in Settings; verify Health Check passes/fails as expected.
- Toggle direct-upload; disable iPhone reachability and confirm Watch uses direct upload when enabled.
- Kill/relaunch apps; ensure settings persist and apply without rebuild.
- Observe Settings Watch status fields update as you open/close the Watch app.

### To-dos

- [ ] Create AppSettings singleton with UserDefaults persistence
- [ ] Add SettingsView with URL/userId/toggle and test/sync actions
- [ ] Make ContentView a TabView; keep Home minimal heart rate
- [ ] Refactor Uploader to use runtime URL from AppSettings
- [ ] Send settings to Watch via updateApplicationContext on changes
- [ ] Implement WatchSettings backed by UserDefaults with defaults
- [ ] Refactor WatchUploader to pull URL/userId from WatchSettings
- [ ] Handle didReceiveApplicationContext to persist settings on Watch
- [ ] Manual test matrix: URL change, reachability, persistence, status UI