import { Ammo } from '@/physics';

// 管理所有载具刚体的集合
export const vehicleRigidBodies: Set<Ammo.btRigidBody> = new Set();

export class VehicleCollisionHandler {
    public static healthMap: Map<Ammo.btRigidBody, number> = new Map();

    public static registerVehicle(vehicle: Ammo.btRigidBody, initialHealth: number = 100): void {
        vehicleRigidBodies.add(vehicle);
        this.healthMap.set(vehicle, initialHealth);
        // console.log('车辆注册');

    }

    public static handleCollision(vehicle: Ammo.btRigidBody, otherBody: Ammo.btRigidBody, damage: number = 1): void {
        if (this.healthMap.has(vehicle)) {
            this.reduceHealth(vehicle, damage);
            // console.log('Vehicle health:', this.healthMap.get(vehicle));
        }
    }

    private static reduceHealth(vehicle: Ammo.btRigidBody, amount: number): void {
        const currentHealth = this.healthMap.get(vehicle) || 0;
        const newHealth = currentHealth - amount;
        this.healthMap.set(vehicle, newHealth);
        // if (newHealth <= 0) {
        //     console.log('Vehicle destroyed!');
        //     this.healthMap.delete(vehicle);
        //     vehicleRigidBodies.delete(vehicle);
        // }
    }
    
}
