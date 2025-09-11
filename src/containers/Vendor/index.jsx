import React, { useState } from "react";
import BaseDialog from "../BaseDialog";
import "./style.css";
import VendorMenu from "./VendorMenu";
import BuySeeds from "./BuySeeds";
import RollChances from "./RollChances";
import CustomSeedsDialog from "../CustomSeedsDialog";
import { ID_SEED_SHOP_ITEMS, ID_SEED_SHOP_PAGES } from "../../constants/id";
import { SEED_PACK_STATUS } from "../../constants/seedPack";
import SeedRollingDialog from "../SeedRollingDialog";
const VendorDialog = ({ onClose, label = "VENDOR", header = "" }) => {
  const [pageIndex, setPageIndex] = useState(ID_SEED_SHOP_PAGES.SEED_PACK_LIST);
  const [selectedSeed, setSelectedSeed] = useState(0);
  const [selectedSeedPack, setSelectedSeedPack] = useState({});
  const [isCustomDlg, setIsCustomDlg] = useState(false);
  const [isRollingDlg, setIsRollingDlg] = useState(false);
  const [rollingInfo, setRollingInfo] = useState({});
  const [seedStatus, setSeedStatus] = React.useState({
    [ID_SEED_SHOP_ITEMS.FEEBLE_SEED]: {
      label: "Feeble Seeds",
      status: SEED_PACK_STATUS.NORMAL,
      count: 0,
    },
    [ID_SEED_SHOP_ITEMS.PICO_SEED]: {
      label: "Pico Seeds",
      status: SEED_PACK_STATUS.NORMAL,
      count: 0,
    },
    [ID_SEED_SHOP_ITEMS.BASIC_SEED]: {
      label: "Basic Seeds",
      status: SEED_PACK_STATUS.NORMAL,
      count: 0,
    },
    [ID_SEED_SHOP_ITEMS.PREMIUM_SEED]: {
      label: "Premium Seeds",
      status: SEED_PACK_STATUS.NORMAL,
      count: 0,
    },
  });

  const onSeedsClicked = (id) => {
    setSelectedSeed(id);
    if (seedStatus[id].status === SEED_PACK_STATUS.COMMITED) {
      setSeedStatus((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: SEED_PACK_STATUS.NORMAL,
        },
      }));
      setRollingInfo({
        id,
        count: seedStatus[id].count,
      });
      setIsRollingDlg(true);
    } else {
      setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_DETAIL);
    }
  };

  const onRollChancesClicked = () => {
    setPageIndex(ID_SEED_SHOP_PAGES.ROLL_CHANCES);
  };

  const onBuy = (item) => {
    setSelectedSeedPack(item);
    if (item.count === 0) {
      setIsCustomDlg(true);
    } else {
      handleBuy(item);
    }
  };

  const onConfirm = (count) => {
    handleBuy({
      ...selectedSeedPack,
      count,
    });
    setIsCustomDlg(false);
  };

  const handleBuy = (item) => {
    setIsRollingDlg(false);
    setSeedStatus((prev) => ({
      ...prev,
      [selectedSeed]: {
        ...prev[selectedSeed],
        status: SEED_PACK_STATUS.COMMITING,
        count: item.count,
      },
    }));
    setTimeout(() => {
      setSeedStatus((prev) => ({
        ...prev,
        [selectedSeed]: {
          ...prev[selectedSeed],
          status: SEED_PACK_STATUS.COMMITED,
        },
      }));
    }, 3000);
    setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_LIST);
  };

  return !isRollingDlg ? (
    <BaseDialog title={label} onClose={onClose} header={header}>
      {pageIndex === ID_SEED_SHOP_PAGES.SEED_PACK_LIST && (
        <VendorMenu
          seedStatus={seedStatus}
          onSeedsClicked={onSeedsClicked}
          onRollChancesClicked={onRollChancesClicked}
        ></VendorMenu>
      )}
      {pageIndex === ID_SEED_SHOP_PAGES.SEED_PACK_DETAIL && (
        <BuySeeds
          menuId={selectedSeed}
          onBack={() => {
            setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_LIST);
          }}
          onBuy={onBuy}
        ></BuySeeds>
      )}
      {pageIndex === ID_SEED_SHOP_PAGES.ROLL_CHANCES && (
        <RollChances
          onBack={() => {
            setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_LIST);
          }}
        ></RollChances>
      )}
      {isCustomDlg && (
        <CustomSeedsDialog
          price={selectedSeedPack.price}
          onConfirm={onConfirm}
          onClose={() => {
            setIsCustomDlg(false);
          }}
        ></CustomSeedsDialog>
      )}
    </BaseDialog>
  ) : (
    <SeedRollingDialog
      rollingInfo={rollingInfo}
      onClose={onClose}
      onBack={() => setIsRollingDlg(false)}
      onBuyAgain={() => {
        handleBuy(rollingInfo);
      }}
    ></SeedRollingDialog>
  );
};

export default VendorDialog;
