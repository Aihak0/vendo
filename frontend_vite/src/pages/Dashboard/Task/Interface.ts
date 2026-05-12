
export interface TaskAddModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface TaskEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataEdit: any;
}

export interface TaskDeleteModalProps{
    isOpen: boolean;
    onClose: () =>void;
    dataDelete: string[]
}