import { type Mesin } from "../../Dashboard/Mesin/Interface";
export interface MesinInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataInfo: Mesin | null;
}

export interface MesinMaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataMesin: Mesin | null;
}