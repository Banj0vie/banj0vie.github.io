export class CropItemClass {
    constructor() {
        this.seedId = null;
        this.growStatus = 0;
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
            return c;
        });
    }

    // Plant a crop (seedId) at a given index. Returns true if planted.
    plantCropAt(arrayIndex, seedId) {
        if (arrayIndex < 0 || arrayIndex >= this.arrays.length) return false;
        const item = this.arrays[arrayIndex];
        if (!item) return false;
        // only plant if slot is empty
        if (item.seedId !== null && item.seedId !== undefined) return false;
        item.seedId = seedId;
        item.growStatus = -1; // newly planted
        return true;
    }

    // Remove crop at index (harvest or clear)
    removeCropAt(arrayIndex) {
        if (arrayIndex < 0 || arrayIndex >= this.arrays.length) return false;
        const item = this.arrays[arrayIndex];
        if (!item) return false;
        item.seedId = null;
        item.growStatus = 0;
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
    plantAll(seedId, maxCount = Infinity) {
        let planted = 0;
        for (let i = 0; i < this.arrays.length && planted < maxCount; i++) {
            if (this.arrays[i].seedId === null || this.arrays[i].seedId === undefined) {
                this.arrays[i].seedId = seedId;
                this.arrays[i].growStatus = -1;
                planted++;
            }
        }
        return planted;
    }
}