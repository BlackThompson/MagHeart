import Foundation
import HealthKit

final class HealthKitAuth {
    static let shared = HealthKitAuth()
    private let store = HKHealthStore()

    func requestPermissions(completion: @escaping (Bool) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else { completion(false); return }
        let types: Set = [HKObjectType.quantityType(forIdentifier: .heartRate)!]
        store.requestAuthorization(toShare: [], read: types) { ok, _ in
            DispatchQueue.main.async { completion(ok) }
        }
    }
}

