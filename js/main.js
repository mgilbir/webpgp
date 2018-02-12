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

function decrypt() {
    var privkey = document.getElementById("private_key").value
    var passphrase = document.getElementById("passphrase").value
    
    var privKeyObj = openpgp.key.readArmored(privkey).keys[0];

    privKeyObj.decrypt(passphrase);

    var oReq = new XMLHttpRequest();
    
    oReq.onload = function(e) {
        var encryptedText = oReq.responseText; // not responseText

        options = {
            message: openpgp.message.readArmored(encryptedText),     // parse armored message
            // publicKeys: openpgp.key.readArmored(pubkey).keys,    // for verification (optional)
            privateKey: privKeyObj // for decryption
        };
        
        openpgp.decrypt(options).then(function(plaintext) {
            // document.getElementById("result").innerHTML = plaintext.data;
            var blob = new Blob([plaintext.data], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "hello_world.txt");
        });    

    }
    
    var url = document.getElementById("encrypted_url").value

    oReq.open("GET", url);
    oReq.send();
}
