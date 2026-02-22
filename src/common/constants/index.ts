export enum UserRole {
    STUDENT = 'student',
    ADMIN = 'admin',
    // Potential future roles: MENTOR, PARENT
}

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
}

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export enum KitStatus {
    AVAILABLE = 'available',
    INVENTORY = 'inventory',
    DISPATCHED = 'dispatched',
    DELIVERED = 'delivered',
    ACTIVATED = 'activated',
}
