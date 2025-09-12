import React, { useState } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { FARM_HOTSPOTS, FARM_VIEWPORT } from "../constants/scene_farm";
import { ID_FARM_HOTSPOTS } from "../constants/app_ids";
import FarmerDialog from "../containers/Farmer";
import { dialogFrames } from "../constants/_baseimages";
import FarmInterface from "../layouts/FarmInterface";
import FarmMenu from "../layouts/FarmInterface/FarmMenu";
import SelectSeedDialog from "../containers/SelectSeedDialog";
import { getRandomSeedEntry } from "../utils/basic";
import { CropItemArrayClass } from "../models/crop";
const Farm = () => {
  const { width, height } = FARM_VIEWPORT;
  const hotspots = FARM_HOTSPOTS;
  const initialSeeds = [
    //for testing
    { ...getRandomSeedEntry(), count: 1 },
    { ...getRandomSeedEntry(), count: 2 },
    { ...getRandomSeedEntry(), count: 3 },
    { ...getRandomSeedEntry(), count: 4 },
    { ...getRandomSeedEntry(), count: 5 },
  ];
  const [isFarmMenu, setIsFarmMenu] = useState(false);
  const [isPlanting, setIsPlanting] = useState(true);
  const [isSelectCropDialog, setIsSelectCropDialog] = useState(false);
  const [cropArray, setCropArray] = useState(new CropItemArrayClass());
  const [previewCropArray, setPreviewCropArray] = useState(cropArray);
  const [currentSeeds, setCurrentSeeds] = useState(initialSeeds);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(-1);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [selectedSeed, setSelectedSeed] = useState(null);

  const plant = () => {
    if (!isFarmMenu) {
      setPreviewCropArray(cropArray);
      setCurrentSeeds(initialSeeds);
    }
    setIsFarmMenu(true);
    setIsPlanting(true);
  };

  const plantAll = () => {
    // copy preview array so we don't mutate state directly
    const newPreview = new CropItemArrayClass();
    newPreview.copyFrom(previewCropArray);

    const updatedSeeds = currentSeeds.map((s) => ({ ...s }));
    let seedPtr = 0;
    // iterate over slots and try to plant seeds from updatedSeeds
    for (let i = 0; i < newPreview.getLength(); i++) {
      if (seedPtr >= updatedSeeds.length) break; // no more seeds
      const slot = newPreview.getItem(i);
      if (slot && (slot.seedId === null || slot.seedId === undefined)) {
        // find next available seed with count > 0
        while (
          seedPtr < updatedSeeds.length &&
          updatedSeeds[seedPtr].count <= 0
        ) {
          seedPtr++;
        }
        if (seedPtr >= updatedSeeds.length) break;
        const seed = updatedSeeds[seedPtr];
        newPreview.plantCropAt(i, seed.id);
        seed.count -= 1;
        if (seed.count <= 0) seedPtr++;
      }
    }

    // filter out exhausted seeds
    const remainingSeeds = updatedSeeds.filter((s) => s.count > 0);
    setPreviewCropArray(newPreview);
    setCurrentSeeds(remainingSeeds);
    setIsFarmMenu(true);
    setIsPlanting(true);
  };

  const harvest = () => {
    setPreviewCropArray(cropArray);
    setIsPlanting(false);
    setIsFarmMenu(true);
  };

  const harvestAll = () => {
    const newCropArray = new CropItemArrayClass();
    newCropArray.copyFrom(cropArray);
    for (let i = 0; i < newCropArray.getLength(); i++) {
      if (newCropArray.getItem(i)?.seedId) {
        // remove crop at this index
        newCropArray.removeCropAt(i);
      }
    }
    setCropArray(newCropArray);
    setIsFarmMenu(false);
    setIsPlanting(true);
  };

  const handlePlant = () => {
    // ensure preview's negative growStatus (-1) become planted (1) before committing
    const newCropArray = new CropItemArrayClass();
    newCropArray.copyFrom(previewCropArray);
    for (let i = 0; i < newCropArray.getLength(); i++) {
      const it = newCropArray.getItem(i);
      if (it && it.growStatus === -1) {
        it.growStatus = 1;
      }
    }
    setCropArray(newCropArray);
    setIsFarmMenu(false);
  };

  const handleHarvest = () => {
    if (!selectedIndexes || selectedIndexes.length === 0) return;
    const newCropArray = new CropItemArrayClass();
    newCropArray.copyFrom(cropArray);
    selectedIndexes.forEach((idx) => {
      if (idx >= 0 && idx < newCropArray.getLength()) {
        newCropArray.removeCropAt(idx);
      }
    });
    setCropArray(newCropArray);
    setSelectedIndexes([]);
    setIsFarmMenu(false);
    setIsPlanting(true);
  };

  const handleCancel = () => {
    setSelectedIndexes([]);
    setIsFarmMenu(false);
    setIsPlanting(true);
  };

  const onClickCrop = (isShift, index) => {
    if (isPlanting) {
      if (isShift && selectedSeed) {
        // pass index directly to handler so it doesn't rely on state update timing
        const currentSeedIndex = currentSeeds.findIndex(
          (s) => s.id === selectedSeed
        );
        if (currentSeedIndex === -1) {
          // selected seed no longer available
          setSelectedSeed(null);
          setCurrentFieldIndex(index);
          setIsSelectCropDialog(true);
          plant();
          return;
        }
        if (currentSeeds[currentSeedIndex].count <= 0) {
          // selected seed exhausted
          setCurrentFieldIndex(index);
          setIsSelectCropDialog(true);
          plant();
          return;
        }
        setCurrentFieldIndex(index);
        handleClickSeedFromDialog(selectedSeed, index);
      } else {
        setCurrentFieldIndex(index);
        setIsSelectCropDialog(true);
        plant();
      }
    } else {
      // toggle selection: add index if missing, remove if present
      setSelectedIndexes((prev) => {
        const exists = prev.includes(index);
        if (exists) return prev.filter((i) => i !== index);
        return [...prev, index];
      });
    }
  };
  const handleClickSeedFromDialog = (id, fieldIndex) => {
    setIsSelectCropDialog(false);
    const idx = typeof fieldIndex === "number" ? fieldIndex : currentFieldIndex;
    if (idx < 0) return;
    const newPreviewCropArray = new CropItemArrayClass();
    newPreviewCropArray.copyFrom(previewCropArray);
    newPreviewCropArray.plantCropAt(idx, id);
    setPreviewCropArray(newPreviewCropArray);

    // decrement seed count immutably; remove seed entries with count <= 0
    const seedIndex = currentSeeds.findIndex((s) => s.id === id);
    if (seedIndex === -1) return;
    setSelectedSeed(id);
    const updatedSeeds = currentSeeds
      .map((s, idx) =>
        idx === seedIndex ? { ...s, count: s.count - 1 } : { ...s }
      )
      .filter((s) => s.count > 0);
    setCurrentSeeds(updatedSeeds);
  };

  const dialogs = [
    {
      id: ID_FARM_HOTSPOTS.DEX,
      component: FarmerDialog,
      label: "FARMER",
      header: dialogFrames.modalHeaderSeeds,
      actions: {
        plant,
        plantAll,
        harvest,
        harvestAll,
      },
    },
  ];
  return (
    <div>
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/farm.gif"
        hotspots={hotspots}
        width={width}
        height={height}
        dialogs={dialogs}
        hideMenu={isFarmMenu}
      >
        <FarmInterface
          cropArray={isFarmMenu ? previewCropArray : cropArray}
          onClickCrop={onClickCrop}
          isFarmMenu={isFarmMenu}
          isPlanting={isPlanting}
        />
      </PanZoomViewport>
      {isFarmMenu && (
        <FarmMenu
          isPlant={isPlanting}
          onCancel={handleCancel}
          onPlant={handlePlant}
          onHarvest={handleHarvest}
        />
      )}
      {isSelectCropDialog && (
        <SelectSeedDialog
          seeds={currentSeeds}
          onClose={() => setIsSelectCropDialog(false)}
          onClickSeed={handleClickSeedFromDialog}
        />
      )}
    </div>
  );
};

export default Farm;
