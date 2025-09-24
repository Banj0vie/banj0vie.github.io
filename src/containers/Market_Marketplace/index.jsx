import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import BaseButton from "../../components/buttons/BaseButton";
import { ID_MARKETPLACE_PAGES } from "../../constants/app_ids";
import BaseDivider from "../../components/dividers/BaseDivider";
import CardListView from "../../components/boxes/CardListView";
import SellDialog from "./SellDialog";
import BatchBuyDialog from "./BatchBuyDialog";
import BuyDialog from "./BuyDialog";
import { useAgwEthersAndService } from "../../hooks/useAgwEthersAndService";

const MarketPlaceDialog = ({ onClose, label = "VENDOR", header = "" }) => {
  const [pageIndex, setPageIndex] = useState(
    ID_MARKETPLACE_PAGES.MARKET_PLACE_MENU
  );
  const data = [
    { label: "Trading Fee", value: "5%" },
    { label: "Fees Burned", value: "0" },
    { label: "Total Listings", value: "0" },
    { label: "Total Sales", value: "0" },
    { label: "Volume", value: "0" },
  ];

  const { account } = useAgwEthersAndService();

  switch (pageIndex) {
    case ID_MARKETPLACE_PAGES.SELL:
      return (
        <SellDialog
          onClose={onClose}
          onBack={() => setPageIndex(ID_MARKETPLACE_PAGES.MARKET_PLACE_MENU)}
        />
      );
    case ID_MARKETPLACE_PAGES.BUY:
      return (
        <BuyDialog
          onClose={onClose}
          onBack={() => setPageIndex(ID_MARKETPLACE_PAGES.MARKET_PLACE_MENU)}
        ></BuyDialog>
      );
    case ID_MARKETPLACE_PAGES.BATCH_BUY:
      return (
        <BatchBuyDialog
          excludeSeller={account}
          onClose={onClose}
          onBack={() => setPageIndex(ID_MARKETPLACE_PAGES.MARKET_PLACE_MENU)}
        ></BatchBuyDialog>
      );
    default:
      return (
        <BaseDialog onClose={onClose} header={header} title={label}>
          <div className="marketplace-dialog">
            <BaseButton
              className="h-3rem"
              label="Sell"
              onClick={() => setPageIndex(ID_MARKETPLACE_PAGES.SELL)}
            ></BaseButton>
            <BaseButton
              className="h-3rem"
              label="Buy"
              onClick={() => setPageIndex(ID_MARKETPLACE_PAGES.BUY)}
            ></BaseButton>
            <BaseButton
              className="h-3rem"
              label="Batch Buy"
              onClick={() => setPageIndex(ID_MARKETPLACE_PAGES.BATCH_BUY)}
            ></BaseButton>
            <BaseDivider></BaseDivider>
            <div className="text-center">Market Stats</div>
            <CardListView data={data}></CardListView>
          </div>
        </BaseDialog>
      );
  }
};

export default MarketPlaceDialog;
