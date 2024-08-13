const decoder = new TextDecoder();
const encoder = new TextEncoder();
/**  @type WebAssembly.Instance  */
var instance;

function encodeString(string) {
  console.log("encodeString string len", string.length);
  const buffer = encoder.encode(string);
  console.log("encodeString buffer len", buffer.length);
  const ptr = instance.exports.getMem(buffer.length);
  if (ptr == 0) {
    throw Error("getMem() returned null");
  }
  const slice = new Uint8Array(
    instance.exports.memory.buffer,
    ptr,
    buffer.length,
  );
  slice.set(buffer);
  // console.log("encodeString slice len", slice.length);
  return [ptr, buffer.length];
}

function parseJson(ev) {
  const input = document.getElementById("input");
  const jsonth = document.getElementById("json-th");
  if (input.textContent == "") {
    jsonth.classList.remove("err");
    return;
  }
  console.log("parseJson len", input.textContent.length);

  const [ptr, plen] = encodeString(input.textContent.trimEnd());

  let outptr = instance.exports.parseBuildRender(
    ptr,
    plen,
    document.getElementById("debug-json").checked,
    document.getElementById("dump-schema").checked,
    document.getElementById("input-schema").checked,
    document.getElementById("add-test").checked,
  );

  if (outptr == 0) {
    jsonth.classList.add("err");
    return;
  }

  jsonth.classList.remove("err");
  const arr = new Uint8Array(instance.exports.memory.buffer, outptr);
  const len = arr.findIndex((c) => c == 0);
  const s = decoder.decode(arr.slice(0, len));
  document.getElementById("output").textContent = s;
}

const importObj = {
  env: {
    consoleLog: (ptr, len) => {
      const s = decoder.decode(
        new Uint8Array(instance.exports.memory.buffer, ptr, len),
      );
      console.log(s);
    },
  },
};

window.addEventListener("load", () => {
  // console.log("onload");
  WebAssembly.instantiateStreaming(fetch("lib.wasm"), importObj).then((res) => {
    instance = res.instance;
    // console.log(instance);
  });
  document.getElementById("input").addEventListener("keyup", parseJson);
  document.getElementById("input").focus();
  document.getElementById("input").textContent = "";
  document.getElementById("copy-btn").addEventListener("click", copyBtnClick);
  document.getElementById("debug-json").addEventListener("change", parseJson);
  document.getElementById("dump-schema").addEventListener("change", parseJson);
  document.getElementById("add-test").addEventListener("change", parseJson);
  // Init
  themeSwitcher.init();
});

// Copy contents of the output to clipboard
function copyBtnClick() {
  console.log("copyBtnClick");
  var elm = document.getElementById("output");

  if (document.body.createTextRange) {
    // for ie
    var range = document.body.createTextRange();

    range.moveToElementText(elm);
    range.select();

    document.execCommand("Copy");
  } else if (window.getSelection) {
    // other browsers
    var selection = window.getSelection();
    var range = document.createRange();

    range.selectNodeContents(elm);
    selection.removeAllRanges();
    selection.addRange(range);

    document.execCommand("Copy");
  }
}
