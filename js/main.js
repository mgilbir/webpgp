function generateKey() {
    var clipboard = new Clipboard('.copy_btn');

    //Set input as readOnly
    document.getElementById("name").readOnly = true;
    document.getElementById("email").readOnly = true;
    document.getElementById("passphrase").readOnly = true;

    var name = document.getElementById("name").value;
    var email = document.getElementById("email").value;
    var passphrase = document.getElementById("passphrase").value;

    var options = {
        userIds: [{ name: name, email: email }], // multiple user IDs
        numBits: 4096,                                            // RSA key size
        passphrase: passphrase // protects the private key
    };

    document.getElementById("generating_button").hidden = true;
    document.getElementById("generating_spinner").hidden = false;
    
    openpgp.generateKey(options).then(function(key) {
        var privkey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
        var pubkey = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '

        document.getElementById("generated_private_key").value = privkey;
        document.getElementById("generated_public_key").value = pubkey;
        $(".collapse").collapse('show');

        document.getElementById("generating_spinner").hidden = true;

    }).catch(function(e) {
        reset_key_generation_state();
        console.log(e)
    });
}

function reset_key_generation_state() {
    //Set input as readOnly
    document.getElementById("name").readOnly = false;
    document.getElementById("email").readOnly = false;
    document.getElementById("passphrase").readOnly = false;

    document.getElementById("generating_button").hidden = false;
    document.getElementById("generating_spinner").hidden = true;
}

var encrypted_data;

function decrypt() {
    var privkey = document.getElementById("private_key").value
    var passphrase = document.getElementById("passphrase").value
    
    var privKeyObj = openpgp.key.readArmored(privkey).keys[0];

    privKeyObj.decrypt(passphrase);

    var selectedFile = document.getElementById('encrypted_file').files[0];
    destination_filename = selectedFile.name.substring(0, selectedFile.name.lastIndexOf("."))
    load_from_file(selectedFile).then(
        (encryptedText) => openpgp_decrypt(encryptedText, privKeyObj)
    ).then(
        (plaintext) => {
            var blob = new Blob([plaintext.data]);
            saveAs(blob, destination_filename);
        },
        (error) => {
            console.log(error)
        }
    )
}

function openpgp_decrypt(encryptedText, privKeyObj) {
    options = {
        message: openpgp.message.readArmored(encryptedText),     // parse armored message
        // publicKeys: openpgp.key.readArmored(pubkey).keys,    // for verification (optional)
        privateKey: privKeyObj, // for decryption
        format: 'binary'
    };
    
    return openpgp.decrypt(options);
}

function load_from_file(file) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = function(event) {
            resolve(event.target.result);
        };
        reader.onerror = function(event) {
            reject(event)
        }
        reader.readAsText(file);
    });
}

function load_from_file_binary(file) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = function(event) {
            resolve(new Uint8Array(event.target.result));
        };
        reader.onerror = function(event) {
            reject(event)
        }
        reader.readAsArrayBuffer(file);
    });
}

function encrypt() {
    return encryptFile();
}

function openpgp_encrypt(sourceData, pubKeyObj) {
    options = {
        data: sourceData,
        publicKeys: pubKeyObj,
        format: 'binary'
    };
    
    return openpgp.encrypt(options);
}

function encryptFile() {
    var pubkey = document.getElementById("public_key").value
    
    var pubKeyObj = openpgp.key.readArmored(pubkey).keys[0];

    var selectedFile = document.getElementById('source_file').files[0];
    destination_filename = selectedFile.name + ".gpg"
    load_from_file_binary(selectedFile).then(
        (sourceData) => openpgp_encrypt(sourceData, pubKeyObj)
    ).then(
        (encryptedData) => {
            var blob = new Blob([encryptedData.data]);
            saveAs(blob, destination_filename);
        },
        (error) => {
            console.log(error)
        }
    )
}
