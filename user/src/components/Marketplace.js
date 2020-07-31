import React, { useState, useEffect } from "react";
import { Loading, TransactionsTable } from ".";
import callApi from "../utils/callApi";

const Marketplace = () => {
  const [transactions, setTransactions] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      try {
        let user = await localStorage.getItem("user");
        user = JSON.parse(user);

        if (user?.userId && user?.apiKey && user?.marketplace) {
          const transactionsResponse = await callApi('transactions', { 
            userId: user?.userId,
            apiKey: user?.apiKey,
            deviceId: 'marketplace'
          });

          if (!transactionsResponse?.error && transactionsResponse?.status !== 'error') {
            setTransactions(transactionsResponse?.transactions);
            setLoading(false);
          } else {
            console.error("Error loading transaction data", transactionsResponse?.error);
          }
        }
      } catch (err) {
        console.error('Error while loading transaction data', err);
      }
    }
    
    loadTransactions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
      <React.Fragment>
        {
            loading ? <Loading /> : <TransactionsTable data={transactions} />
        }
      </React.Fragment>
  );
};

export default Marketplace;