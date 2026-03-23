import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import SageMenu from "./SageMenu";
import { ID_SAGE_PAGES } from "../../constants/app_ids";
import WeeklyWage from "./WeeklyWage";
import WeeklyHarvest from "./WeeklyHarvest";
import WorkerBee from "./WorkerBee";

const SageDialog = ({ onClose, label = "VENDOR", header = "", headerOffset = 0 }) => {
  const [pageIndex, setPageIndex] = useState(ID_SAGE_PAGES.SAGE_MENU);
  return (
    <BaseDialog onClose={onClose} title={label} header={header} headerOffset={headerOffset}>
      {pageIndex === ID_SAGE_PAGES.SAGE_MENU && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <SageMenu
            onWeeklyWage={() => setPageIndex(ID_SAGE_PAGES.WEEKLY_WAGE)}
            onWeeklyHarvest={() => setPageIndex(ID_SAGE_PAGES.WEEKLY_HARVEST)}
            onWorkerBee={() => setPageIndex("WORKER_BEE")}
          />
          
          {/* Failsafe Button so you literally cannot miss the upgrade screen */}
          <button 
            onClick={() => setPageIndex("WORKER_BEE")}
            style={{ marginTop: '20px', padding: '15px 30px', backgroundColor: 'rgba(0, 255, 65, 0.2)', border: '2px solid #00ff41', color: '#00ff41', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 0 15px rgba(0,255,65,0.4)', transition: 'transform 0.2s' }}
          >
            🐝 UPGRADE WORKER BEE
          </button>
        </div>
      )}
      {pageIndex === ID_SAGE_PAGES.WEEKLY_WAGE && (
        <WeeklyWage
          onBack={() => setPageIndex(ID_SAGE_PAGES.SAGE_MENU)}
        ></WeeklyWage>
      )}
      {pageIndex === ID_SAGE_PAGES.WEEKLY_HARVEST && (
        <WeeklyHarvest
          onBack={() => setPageIndex(ID_SAGE_PAGES.SAGE_MENU)}
        ></WeeklyHarvest>
      )}
        {pageIndex === "WORKER_BEE" && (
          <WorkerBee
            onBack={() => setPageIndex(ID_SAGE_PAGES.SAGE_MENU)}
          ></WorkerBee>
        )}
    </BaseDialog>
  );
};

export default SageDialog;
