const RLP = require("rlp");
const { arrToBufArr } = require("ethereumjs-util");
const Trie = require("merkle-patricia-tree").BaseTrie;
const Web3 = require("web3");
const web3 = new Web3("http://192.168.100.38:12320");
const readline = require("readline");
const { stdin: input, stdout: output } = require("process");

// 트랜잭션을 RLP 형식으로 인코딩
function createRLPTransaction(transaction) {
  return arrToBufArr(
    RLP.encode([
      transaction.nonce,
      Number(transaction.gasPrice),
      transaction.gas,
      transaction.to,
      Number(transaction.value),
      transaction.input,
      transaction.v,
      transaction.r,
      transaction.s,
    ])
  );
}

// 트랜잭션 루트 계산 함수
async function calculateTransactionRoot(txns) {
  // 새로운 Trie 정의
  const trie = new Trie();

  // 트랜잭션 리스트를 순회하여 trie 생성
  for (let i = 0; i < txns.length; i++) {
    console.log(`idx: ${i}, tx: ${txns[i]}`);
    const currTxn = await web3.eth.getTransaction(txns[i]); // 대상 트랜잭션
    const rlpEncodedTxn = createRLPTransaction(currTxn); // 트랜잭션을 rlp 형식으로 변환
    const txReceipt = await web3.eth.getTransactionReceipt(txns[i]); // 트랜잭션 영수증으로부터
    const path = Buffer.from(RLP.encode(txReceipt.transactionIndex)); // 블록 내 트랜잭션의 index를 얻고, rlp 형식으로 인코딩
    await trie.put(path, rlpEncodedTxn); // 인코딩된 트랜잭션과 index 정보를 trie에 추가
  }
  const evaluatedTxnRoot = "0x" + trie.root.toString("hex"); // 최종 구성된 trie의 루트해시 값
  return evaluatedTxnRoot;
}

// 블록넘버를 입력으로 받아 해당 블록의 트랜잭션 머클트리(트라이) 해시값 계산
async function main(blockNumber) {
  const block = await web3.eth.getBlock(blockNumber); // 블록 정보 저장
  //   console.log("block:", block);
  console.log(`블록 번호: ${block["number"]}`);
  console.log(`블록 해시: ${block["hash"]}`);
  console.log(`부모 해시: ${block["parentHash"]}`);
  console.log(`블록 타임스탬프: ${block["timestamp"]}`);
  console.log(`거래 수: ${block["transactions"].length}`);
  const txns = block.transactions; // 블록의 모든 트랜잭션 리스트

  const calculated = await calculateTransactionRoot(txns); // 트랜잭션 머클트리의 해시값 계산
  console.log("calculated: ", calculated); // 계산값 출력
  console.log("actual: ", block.transactionsRoot); // 실제 블록에 저장된 값 출력
}

// 프로그램 실행 시, 블록 넘버를 입력받아 해당 블록에 대하여 스크립트 실행
const rl = readline.createInterface({ input, output });

console.log("Type blockNumber:");
rl.on("line", (line) => {
  main(line);
  rl.close();
});
