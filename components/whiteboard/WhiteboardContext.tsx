import React, { createContext, useContext } from 'react';

interface WhiteboardContextType {
    tasks: any[];
    clients: any[];
    workspace: any;
    onUpdateTask: (taskId: string, data: any) => Promise<void>;
    onAddItem: (type: string, payload?: any) => Promise<void>;
}

const WhiteboardContext = createContext<WhiteboardContextType>({
    tasks: [],
    clients: [],
    workspace: null,
    onUpdateTask: async () => { },
    onAddItem: async () => { },
});

export const useWhiteboardData = () => useContext(WhiteboardContext);

export const WhiteboardProvider = ({ children, data }: { children: React.ReactNode, data: WhiteboardContextType }) => {
    return (
        <WhiteboardContext.Provider value={data}>
            {children}
        </WhiteboardContext.Provider>
    );
};
