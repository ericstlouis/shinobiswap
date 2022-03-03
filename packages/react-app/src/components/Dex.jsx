import { Statistic, Card, Col, Divider, Input, Row } from "antd";
import { useBalance, useContractReader, useBlockNumber } from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { useTokenBalance } from "eth-hooks/erc/erc-20/useTokenBalance";
import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import Address from "./Address";
//Contract component not actually deployed contract
import Contract from "./Contract";  
// import Curve from "./Curve";
import TokenBalance from "./TokenBalance";
import Blockies from "react-blockies";

const contractName = "DEX";
const tokenName = "Shinobi";

export default function Dex(props) {
  let display = [];

  const [form, setForm] = useState({});
  const [values, setValues] = useState({});
  const [shareOfPool, setShareOfPool] = useState();
  const [ethToShinobi, setEthToShinobi] = useState();
  const [ShinobiToEth, setShinobiToEth] = useState();

  const tx = props.tx;

  const writeContracts = props.writeContracts;

  const contractAddress = props.readContracts[contractName].address;
  const tokenAddress = props.readContracts[tokenName].address;
  const contractBalance = useBalance(props.localProvider, contractAddress);

  const tokenBalance = useTokenBalance(props.readContracts[tokenName], contractAddress, props.localProvider);
  const tokenBalanceFloat = parseFloat(ethers.utils.formatEther(tokenBalance));
  const ethBalanceFloat = parseFloat(ethers.utils.formatEther(contractBalance));
  const liquidity = useContractReader(props.readContracts, contractName, "totalLiquidity");
  // const userLiquidity = useContractReader(props.readContracts, contractName, "liquidity", [props.address]);


  const PoolShare = async () => {
    const dexLiquidity = ethers.utils.formatEther(contractBalance);
    // const user = ethers.utils.formatEther(userLiquidity);
    // console.log(user);
  };

  useEffect(() => {
    PoolShare();
  }, [contractBalance])

  const rowForm = (title, icon, onClick) => {
    return (
      <Row>
        <Col span={8} style={{ textAlign: "right", opacity: 0.333, paddingRight: 10, fontSize: 24 }}>
          {title}
        </Col>
        <Col span={16}>
          <div style={{ cursor: "pointer", margin: 2 }}>
            <Input
              onChange={e => {
                let newValues = { ...values };
                newValues[title] = e.target.value;
                console.log(newValues);
                setValues(newValues);
              }}
              value={values[title]}
              addonAfter={
                <div
                  type="default"
                  onClick={() => {
                    onClick(values[title]);
                    let newValues = { ...values };
                    newValues[title] = "";
                    setValues(newValues);
                  }}
                >
                  {icon}
                </div>
              }
            />
          </div>
        </Col>
      </Row>
    );
  };

  if (props.readContracts ? props.readContracts[contractName] : null) {
    display.push(
      <div>
        {rowForm("ethToToken", "💸", async value => {
          let valueInEther = ethers.utils.parseEther("" + value);
          let swapEthToTokenResult = await tx(writeContracts[contractName]["ethToToken"]({ value: valueInEther }));
          console.log("swapEthToTokenResult:", swapEthToTokenResult);
        })}
        {rowForm("tokenToEth", "🔏", async value => {
          let valueInEther = ethers.utils.parseEther("" + value);
          console.log("valueInEther", valueInEther);
          let allowance = await props.readContracts[tokenName].allowance(
            props.address,
            props.readContracts[contractName].address,
          );
          console.log("allowance", allowance);

          let approveTx;
          if (allowance.lt(valueInEther)) {
            approveTx = await tx(
              writeContracts[tokenName].approve(props.readContracts[contractName].address, valueInEther, {
                gasLimit: 200000,
              }),
            );
          }

          let swapTx = tx(writeContracts[contractName]["tokenToEth"](valueInEther, { gasLimit: 200000 }));
          if (approveTx) {
            console.log("waiting on approve to finish...");
            let approveTxResult = await approveTx;
            console.log("approveTxResult:", approveTxResult);
          }
          let swapTxResult = await swapTx;
          console.log("swapTxResult:", swapTxResult);
        })}
        <Divider> Liquidity ({liquidity ? ethers.utils.formatEther(liquidity) : "none"}):</Divider>
        {rowForm("deposit", "📥", async value => {
          let valueInEther = ethers.utils.parseEther("" + value);
          let valuePlusExtra = ethers.utils.parseEther("" + value * 1.03);
          console.log("valuePlusExtra", valuePlusExtra);
          let allowance = await props.readContracts[tokenName].allowance(
            props.address,
            props.readContracts[contractName].address,
          );
          console.log("allowance", allowance);
          if (allowance.lt(valuePlusExtra)) {
            await tx(
              writeContracts[tokenName].approve(props.readContracts[contractName].address, valuePlusExtra, {
                gasLimit: 200000,
              }),
            );
          }
          await tx(writeContracts[contractName]["deposit"]({ value: valueInEther, gasLimit: 200000 }));
        })}
        {rowForm("withdraw", "📤", async value => {
          let valueInEther = ethers.utils.parseEther("" + value);
          let withdrawTxResult = await tx(writeContracts[contractName]["withdraw"](valueInEther));
          console.log("withdrawTxResult:", withdrawTxResult);
        })}
        <Row>
          <Col span={9}>
            <Statistic title="Shinobi per ETH" value={11.28} precision={2} valueStyle={{ color: "#3f8600" }} />
          </Col>
          <Col span={6}>
            <Statistic title="Share of Pool" value={4.98} precision={2} valueStyle={{ color: "#3f8600" }} suffix="%" />
          </Col>
          <Col span={9}>
            <Statistic title="ETH per Shinobi" value={9.3} precision={2} valueStyle={{ color: "#3f8600" }} />
          </Col>
        </Row>
      </div>,
    );
  }

  return (
    <Row span={24} style={{ display: "flex", alignItems: "center", flexDirection: "column-reverse"}}>
      <Col span={12}>
        <Card
          title={
            <div>
              <Address value={contractAddress} />
              <div style={{ float: "right", fontSize: 24 }}>
                {parseFloat(ethers.utils.formatEther(contractBalance)).toFixed(4)} ⚖️
                <TokenBalance name={tokenName} img={"⚔️"} address={contractAddress} contracts={props.readContracts} />
              </div>
            </div>
          }
          size="large"
          loading={false}
        >
          {display}
        </Card>
        {/* <Row span={12}>
          <Contract
            name="Shinobi"
            signer={props.signer}
            provider={props.localProvider}
            show={["balanceOf", "approve"]}
            address={props.address}
            blockExplorer={props.blockExplorer}
            contractConfig={props.contractConfig}
          />
        </Row> */}
      </Col>
      <Col span={12}>
        <div style={{ padding: 20 }}>
          {/* <Curve
            addingEth={values && values["ethToToken"] ? values["ethToToken"] : 0}
            addingToken={values && values["tokenToEth"] ? values["tokenToEth"] : 0}
            ethReserve={ethBalanceFloat}
            tokenReserve={tokenBalanceFloat}
            width={500}
            height={500}
          /> */}
        </div>
      </Col>
    </Row>
  );
}
