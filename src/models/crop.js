export class CropItemClass {
    constructor() {
        this.seedId = null;
        this.growStatus = 0; // 0: empty, -1: newly planted, 1: growing, 2: ready to harvest
        this.plantedAt = null; // timestamp when planted
        this.growthTime = 0; // time in seconds to grow
    }
}

export class CropItemArrayClass {
    constructor(length = 30) { // default 30 but can pass custom
        this.arrays = Array.from({ length }, () => new CropItemClass());
    }

    // Set a CropItemClass at a specific index
    setItem(arrayIndex, item) {
        if (arrayIndex < 0 || arrayIndex >= this.arrays.length) {
            throw new Error(`Array index must be between 0 and ${this.arrays.length - 1}`);
        }
        this.arrays[arrayIndex] = item;
    }

    // Get a CropItemClass at a specific index
    getItem(arrayIndex) {
        if (arrayIndex < 0 || arrayIndex >= this.arrays.length) {
            throw new Error(`Array index must be between 0 and ${this.arrays.length - 1}`);
        }
        return this.arrays[arrayIndex];
    }

    // Optional: get total length
    getLength() {
        return this.arrays.length;
    }

    // Create a shallow copy of internal array items
    copyFrom(other) {
        if (!other || !Array.isArray(other.arrays)) {
            throw new Error("copyFrom expects another CropItemArrayClass instance");
        }
        // copy values (create new CropItemClass instances with same values)
        this.arrays = other.arrays.map((it) => {
            const c = new CropItemClass();
            c.seedId = it.seedId;
            c.growStatus = it.growStatus;
            c.plantedAt = it.plantedAt;
            c.growthTime = it.growthTime;
            return c;
        });
    }

    // Plant a crop (seedId) at a given index. Returns true if planted.
    plantCropAt(arrayIndex, seedId, growthTime = 60) {
        if (arrayIndex < 0 || arrayIndex >= this.arrays.length) return false;
        const item = this.arrays[arrayIndex];
        if (!item) return false;
        // only plant if slot is empty
        if (item.seedId !== null && item.seedId !== undefined) return false;
        item.seedId = seedId;
        item.growStatus = -1; // newly planted
        item.plantedAt = Date.now();
        item.growthTime = growthTime; // default 60 seconds
        return true;
    }

    // Remove crop at index (harvest or clear)
    removeCropAt(arrayIndex) {
        if (arrayIndex < 0 || arrayIndex >= this.arrays.length) return false;
        const item = this.arrays[arrayIndex];
        if (!item) return false;
        item.seedId = null;
        item.growStatus = 0;
        item.plantedAt = null;
        item.growthTime = 0;
        return true;
    }

    // Find first empty slot index or -1
    findFirstEmpty() {
        for (let i = 0; i < this.arrays.length; i++) {
            const it = this.arrays[i];
            if (it.seedId === null || it.seedId === undefined) return i;
        }
        return -1;
    }

    // Return a deep-ish clone (new CropItemArrayClass instance)
    clone() {
        const c = new CropItemArrayClass(this.arrays.length);
        c.copyFrom(this);
        return c;
    }

    // Plant a seed across all empty slots up to count (helper)
    plantAll(seedId, maxCount = Infinity, growthTime = 60) {
        let planted = 0;
        console.log(`plantAll: seedId=${seedId}, maxCount=${maxCount}, growthTime=${growthTime}`);
        
        for (let i = 0; i < this.arrays.length && planted < maxCount; i++) {
            const item = this.arrays[i];
            if (item.seedId === null || item.seedId === undefined) {
                console.log(`✓ Planting at plot ${i}: seedId=${seedId}, status=-1`);
                item.seedId = seedId;
                item.growStatus = -1;
                item.plantedAt = Date.now();
                item.growthTime = growthTime;
                planted++;
            } else {
                console.log(`✗ Plot ${i} already has seed: ${item.seedId} (status: ${item.growStatus})`);
            }
        }
        
        console.log(`plantAll completed: planted ${planted} seeds out of ${maxCount} requested`);
        return planted;
    }

    // Update growth status for all crops based on time
    updateGrowth() {
        const now = Date.now();
        for (let i = 0; i < this.arrays.length; i++) {
            const item = this.arrays[i];
            // Only update crops that are already growing (status 1), not newly planted ones (status -1)
            if (item.seedId && item.plantedAt && item.growStatus === 1) {
                const timeElapsed = (now - item.plantedAt) / 1000; // seconds
                if (timeElapsed >= item.growthTime) {
                    item.growStatus = 2; // ready to harvest
                }
            }
        }
    }

    // Transition newly planted crops to growing status (called after contract planting)
    confirmPlanting() {
        for (let i = 0; i < this.arrays.length; i++) {
            const item = this.arrays[i];
            if (item.seedId && item.growStatus === -1) {
                item.growStatus = 1; // transition to growing
            }
        }
    }

    // Get growth progress for a specific crop (0-1)
    getGrowthProgress(arrayIndex) {
        if (arrayIndex < 0 || arrayIndex >= this.arrays.length) return 0;
        const item = this.arrays[arrayIndex];
        if (!item.seedId || !item.plantedAt || item.growStatus === 0) return 0;
        
        const timeElapsed = (Date.now() - item.plantedAt) / 1000; // seconds
        return Math.min(timeElapsed / item.growthTime, 1);
    }

    // Check if a crop is ready to harvest
    isReadyToHarvest(arrayIndex) {
        if (arrayIndex < 0 || arrayIndex >= this.arrays.length) return false;
        const item = this.arrays[arrayIndex];
        return item.seedId && item.growStatus === 2;
    }

    // Get all crops ready to harvest
    getReadyToHarvest() {
        const ready = [];
        for (let i = 0; i < this.arrays.length; i++) {
            if (this.isReadyToHarvest(i)) {
                ready.push(i);
            }
        }
        return ready;
    }
}