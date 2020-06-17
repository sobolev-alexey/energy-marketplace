import React from 'react';

const AppContext = React.createContext({});

const GlobalState = ({ children }) => {
    return (
        <AppContext.Provider value={{ /* params */ }}>
            {children}
        </AppContext.Provider>
    );
};

export default GlobalState;