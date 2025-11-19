import Foundation
import HealthKit

final class HealthKitAuth {
    static let shared = HealthKitAuth()
    private let store = HKHealthStore()

    func requestPermissions(completion: @escaping (Bool) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else { 
            print("HealthKit is not available on this device")
            DispatchQueue.main.async { completion(false) }
            return 
        }
        
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            print("Failed to create heart rate type")
            DispatchQueue.main.async { completion(false) }
            return
        }
        
        // Check current authorization status
        let currentStatus = store.authorizationStatus(for: heartRateType)
        print("Current HealthKit authorization status: \(currentStatus.rawValue)")
        
        // Treat as authorized only when explicitly authorized
        if currentStatus == .sharingAuthorized {
            print("HealthKit already authorized (status: \(currentStatus.rawValue))")
            DispatchQueue.main.async { completion(true) }
            return
        }
        
        // Request authorization - must be called on main thread
        // This will show the permission dialog if status is .notDetermined
        DispatchQueue.main.async {
            let types: Set<HKObjectType> = [heartRateType]
            print("Requesting HealthKit authorization...")
            self.store.requestAuthorization(toShare: [], read: types) { success, error in
                if let error = error {
                    print("HealthKit authorization error: \(error.localizedDescription)")
                }
                
                // For read-only permissions, consider authorized only when status is sharingAuthorized
                let newStatus = self.store.authorizationStatus(for: heartRateType)
                print("New HealthKit authorization status: \(newStatus.rawValue), success: \(success)")
                
                // Only if explicitly authorized
                let isAuthorized = (newStatus == .sharingAuthorized)
                DispatchQueue.main.async { 
                    completion(isAuthorized)
                }
            }
        }
    }
    
    func checkAuthorizationStatus() -> HKAuthorizationStatus {
        guard HKHealthStore.isHealthDataAvailable(),
              let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            return .notDetermined
        }
        return store.authorizationStatus(for: heartRateType)
    }
    
    func isAuthorized() -> Bool {
        guard HKHealthStore.isHealthDataAvailable(),
              let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            return false
        }
        let status = store.authorizationStatus(for: heartRateType)
        // Only treat as authorized when explicitly authorized
        return status == .sharingAuthorized
    }
}
