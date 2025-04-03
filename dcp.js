import React, { useState, useEffect } from "react";
import { IExecDataProtector } from "@iexec/dataprotector";
import { ethers } from "ethers";

export default function ProtectDataForm() {
  const [protectedDataAddress, setProtectedDataAddress] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [authorizedUserAddress, setAuthorizedUserAddress] = useState("");
  const [protectedDataList, setProtectedDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [protectedContent, setProtectedContent] = useState(null);

  const [newOwnerAddress, setNewOwnerAddress] = useState("");

  // Initialiser le fournisseur Web3 de MetaMask
  const [web3Provider, setWeb3Provider] = useState(null);

  useEffect(() => {
    const initWeb3Provider = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          setWeb3Provider(provider);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setUserAddress(address);
        } catch (error) {
          console.error("Error initializing web3 provider:", error);
          setError("Failed to initialize web3 provider");
        }
      } else {
        setError("MetaMask is not installed");
      }
    };
    initWeb3Provider();
  }, []);

  const dataProtector = web3Provider ? new IExecDataProtector(web3Provider) : null;
  const dataProtectorCore = dataProtector ? dataProtector.core : null;

  //const iExecAuthorizedDappAddress =  "0x3d9d7600b6128c03b7ddbf050934e7ecfe0c61c8"; 
  //const iExecAuthorizedDappAddress =  "0x957448fad2499e1b909020ad9b2582f199098ec3"; 
  //const iExecAuthorizedDappAddress = "0x184dF059d810E37E4115379DF831427B83b2d965";
const iExecAuthorizedDappAddress = "0x329f35b4f56956f8f601003508ff506b62fe833c";

  const protectedDataSubmit = async () => {
    if (!dataProtectorCore) return;
    setIsLoading(true);
    setError("");
    const data = {
      file: "hey@example.com",
      
    };

    try {
      console.log("Début de la protection des données...");

      const result = await dataProtectorCore.protectData({
        name: 'MyProtectedData',
        data: data,
        onStatusUpdate: ({ title, isDone }) => {
          console.log(`${title}: ${isDone ? 'Terminé' : 'En cours'}`);
        }
      });

      console.log("Résultat complet:", result);
      console.log("Adresse des données protégées:", result.address);
      setProtectedDataAddress(result.address);
      await getAllProtectedData(); // Refresh the list
    } catch (error) {
      console.error("Erreur lors de la protection des données:", error);
      setError("Failed to protect data");
    } finally {
      setIsLoading(false);
    }
  };

  const getAllProtectedData = async () => {
    if (!dataProtectorCore) return;
    setIsLoading(true);
    setError("");
    try {
      const listProtectedData = await dataProtectorCore.getProtectedData({
        owner: userAddress,
      });
      console.log({ listProtectedData });
      setProtectedDataList(listProtectedData);
    } catch (error) {
      console.log("Error in getting all protected data: ", error);
      setError("Failed to get protected data");
    } finally {
      setIsLoading(false);
    }
  };

  const getAllGrantedAccess = async () => {
    if (!dataProtectorCore) return;
    setIsLoading(true);
    setError("");
    try {
      const listGrantedAccess = await dataProtectorCore.getGrantedAccess({
        authorizedApp: iExecAuthorizedDappAddress,
        authorizedUser: userAddress
      });
      console.log({ listGrantedAccess });
    } catch (error) {
      console.log("Error in getting all GrantedAccess: ", error);
      setError("Failed to get granted access");
    } finally {
      setIsLoading(false);
    }
  };

  const grantAccessToProtectedData = async () => {
    if (!dataProtectorCore) return;
    setIsLoading(true);
    setError("");
    console.log(protectedDataAddress);
    try {
      const result = await dataProtectorCore.grantAccess({
        protectedData: protectedDataAddress,
        authorizedUser: userAddress,
        authorizedApp: iExecAuthorizedDappAddress,
        numberOfAccess: 2,
        onStatusUpdate: ({ title, isDone }) => {
          console.log(`${title}: ${isDone ? 'Terminé' : 'En cours'}`);
        }
      });
      console.log(result);
    } catch (error) {
      console.log("Error in granting access: ", error);
      setError("Failed to grant access");
    } finally {
      setIsLoading(false);
    }
  };

 
  const getProtectedDataContent = async () => {
    if (!dataProtectorCore) {
      setError("DataProtectorCore is not initialized");
      return;
    }
  
    setIsLoading(true);
    setError("");
    console.log("Starting to process protected data");
  
    try {
      const result = await dataProtectorCore.processProtectedData({
        protectedData: protectedDataAddress,
        app: iExecAuthorizedDappAddress,
        workerpool : "prod-v8-bellecour.main.pools.iexec.eth",//prod-v8-learn.main.pools.iexec.eth
        useVoucher:true,
        voucherAddress:"0x7fff68d27cbc460c34317a8e945392e267cc5b8a",//0x7fff68d27cbc460c34317a8e945392e267cc5b8a //0xE355D2A23F901103f168ED0334aAa5Ca88a3f0Dd
        onStatusUpdate: ({ status, isDone }) => {
          console.log(`${status}: ${isDone ? 'Terminé' : 'En cours'}`);
        },
      });
  
      console.log("Process completed:", result);
  
      // Le résultat est directement disponible après le traitement
      console.log("Protected data content:", result);
  
      // Enregistrer le résultat dans un fichier texte
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'protected_data_result.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  
      return result;
    } catch (error) {
      console.error("Error in getting protected data content:", error);
      setError(`Failed to get protected data content: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeAllAccess = async () => {
    if (!dataProtectorCore || !web3Provider) {
      setError("DataProtectorCore or Web3Provider is not initialized");
      return;
    }
    
    if (!protectedDataAddress) {
      setError("Protected data address is required");
      return;
    }
  
    setIsLoading(true);
    setError("");
    
    try {
      const signer = await web3Provider.getSigner();
      
      // Créer un message à signer
      const message = `Revoke all access for ${protectedDataAddress}`;
      
      // Signer le message
      const signature = await signer.signMessage(message);
  
      console.log("Revoking all access with parameters:", {
        protectedData: protectedDataAddress,
        authorizedUser: authorizedUserAddress,
        authorizedApp: iExecAuthorizedDappAddress,
        sign: signature
      });
  
      const result = await dataProtectorCore.revokeAllAccess({
        protectedData: protectedDataAddress,
        authorizedUser: authorizedUserAddress,
        authorizedApp: iExecAuthorizedDappAddress,
        sign: signature
      });
      
      console.log("All access revoked:", result);
      
      // Rafraîchir la liste des accès accordés après la révocation
      await getAllGrantedAccess();
    } catch (error) {
      console.error("Error revoking all access:", error);
      if (error.errors) {
        console.error("Validation errors:", error.errors);
      }
      setError(`Failed to revoke all access: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const transferOwnership = async () => {
    if (!dataProtectorCore || !protectedDataAddress || !newOwnerAddress) {
      setError("Please ensure DataProtectorCore is initialized and addresses are provided.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const result = await dataProtectorCore.transferOwnership({
        protectedData: protectedDataAddress,
        newOwner: newOwnerAddress,
      });
      
      console.log("Ownership transferred:", result);
      // Refresh the list of protected data or update UI as necessary
      await getAllProtectedData();
    } catch (error) {
      console.error("Error transferring ownership:", error);
      setError(`Failed to transfer ownership: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>iExec Data Protector</h1>
      {isLoading && <p>Loading...</p>}
      <div>
        <h2>Your Address: {userAddress}</h2>
      </div>
      <div>
        <h2>Protect Data</h2>
        <button onClick={protectedDataSubmit} disabled={isLoading}>Protect Data</button>
      </div>
      <div>
        <h2>Manage Protected Data</h2>
        <button onClick={getAllProtectedData} disabled={isLoading}>Get All Protected Data</button>
        {protectedDataList.map(data => (
          <div key={data.address}>
            <p>Name: {data.name}, Address: {data.address}</p>
            <button onClick={() => setProtectedDataAddress(data.address)}>Select</button>
          </div>
        ))}
      </div>
      <div>
        <h2>Access Management</h2>
        <input 
          type="text" 
          placeholder="Authorized User Address" 
          value={authorizedUserAddress} 
          onChange={(e) => setAuthorizedUserAddress(e.target.value)} 
        />
        <button onClick={grantAccessToProtectedData} disabled={isLoading || !protectedDataAddress}>Grant Access</button>
        <button onClick={revokeAllAccess} disabled={isLoading || !protectedDataAddress}>Revoke Access</button>
        <button onClick={getAllGrantedAccess} disabled={isLoading}>Get All Granted Access</button>
      </div>
      <div>
        <h2>Data Content</h2>
        <button onClick={getProtectedDataContent} disabled={isLoading || !protectedDataAddress}>Get Protected Data Content</button>
      </div>
      <div>
        <h2>Transfer Ownership</h2>
        <input 
          type="text" 
          placeholder="New Owner Address" 
          value={newOwnerAddress} 
          onChange={(e) => setNewOwnerAddress(e.target.value)} 
        />
        <button 
          onClick={transferOwnership} 
          disabled={isLoading || !protectedDataAddress || !newOwnerAddress}
        >
          Transfer Ownership
        </button>
      </div>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
}
