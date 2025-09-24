import React, { useEffect, useState } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import {
  ID_INVENTORY_MENUS,
} from "../../constants/app_ids";
import BaseButton from "../../components/buttons/BaseButton";
import ItemSmallView from "../../components/boxes/ItemViewSmall";
import ItemViewUsable from "../../components/boxes/ItemViewUsable";
import { useItems } from "../../hooks/useItems";

const menus = [
  { id: ID_INVENTORY_MENUS.SEEDS, label: "Seeds" },
  { id: ID_INVENTORY_MENUS.PRODUCE, label: "Produce" },
  { id: ID_INVENTORY_MENUS.FISHES, label: "Fishes" },
  { id: ID_INVENTORY_MENUS.ITEMS, label: "Items" },
];

const InventoryDialog = ({ onClose }) => {
  const [selectedMenu, setSelectedMenu] = useState(ID_INVENTORY_MENUS.SEEDS);
  const { all: allItems } = useItems();
  const [list, setList] = useState([]);

  const onUseItem = (itemId) => {
    console.log("itemId", itemId);
  };

  useEffect(() => {
    switch (selectedMenu) {
      case ID_INVENTORY_MENUS.SEEDS:
        setList(allItems.filter(item => item.category === 'ID_ITEM_SEED' && item.count > 0));
        break;
      case ID_INVENTORY_MENUS.PRODUCE:
        setList(allItems.filter(item => item.category === 'ID_ITEM_CROP' && item.count > 0));
        break;
      case ID_INVENTORY_MENUS.FISHES:
        setList(allItems.filter(item => item.category === 'ID_ITEM_LOOT' && item.subCategory === 'ID_LOOT_CATEGORY_BAIT' && item.count > 0));
        break;
      case ID_INVENTORY_MENUS.ITEMS:
        setList(allItems.filter(item => ((item.category === 'ID_ITEM_LOOT' && item.subCategory === 'ID_LOOT_CATEGORY_CHEST') || item.category === 'ID_ITEM_POTION') && item.count > 0));
        break;
      default:
        break;
    }
  }, [selectedMenu, allItems]);

  return (
    <BaseDialog onClose={onClose} title="INVENTORY">
      <div className="inventory-dialog">
        <div className="layout">
          <div className="info-row">
            {menus.map((item, index) => (
              <BaseButton
                className={`button ${index === 0 ? "first" : ""}`}
                label={item.label}
                key={index}
                focused={selectedMenu === item.id}
                onClick={() => setSelectedMenu(item.id)}
              ></BaseButton>
            ))}
          </div>
          <div className="seed-row">
            {selectedMenu !== ID_INVENTORY_MENUS.ITEMS && (
              <div className="seed-row-wrapper">
                {list.map((item, index) => (
                  <ItemSmallView
                    key={index}
                    itemId={item.id}
                    count={item.count}
                  ></ItemSmallView>
                ))}
              </div>
            )}
            {selectedMenu === ID_INVENTORY_MENUS.ITEMS && (
              <div className="seed-list">
                {list.map((item, index) => (
                  <ItemViewUsable
                    key={index}
                    itemId={item.id}
                    count={item.count}
                    onUse={onUseItem}
                    usable={item.usable}
                  ></ItemViewUsable>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

export default InventoryDialog;
