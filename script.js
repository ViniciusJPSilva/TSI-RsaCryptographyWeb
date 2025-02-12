const BLANK_SPACE = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";


// Constantes de configuração
const MIN_PRIME = 11;
const MAX_PRIME = 128;
const INITIAL_EXPONENT = 11;

// Função para verificar se um número é primo
function isPrime(num) {
    if (typeof num !== 'number' || num === '' || isNaN(num)) return false;
    if (num <= 1) return false;

    for (let i = 2; i <= Math.sqrt(num); i++)
        if (num % i === 0) return false;

    return true;
}

// Função para calcular o Máximo Divisor Comum (MDC) usando o Algoritmo de Euclides
function mdc(a, b) {
    let absA = Math.abs(a);
    let absB = Math.abs(b);
    let prevX = 1, x = 0;
    let prevY = 0, y = 1;

    while (absB) {
        const q = Math.floor(absA / absB);
        [absB, absA] = [absA % absB, absB];
        [x, prevX] = [prevX - q * x, x];
        [y, prevY] = [prevY - q * y, y];
    }

    return {
        mdc: absA,
        x: prevX,
        y: prevY
    };
}

// Função para calcular a Função de Carmichael (λ(n)) de dois números primos p e q
function carmichaelFunction(p, q) {
    if (!isPrime(p) || !isPrime(q)) {
        throw new Error('Ambos os números devem ser primos');
    }

    const mdcResult = mdc(p - 1, q - 1).mdc;
    return Math.abs((p - 1) * (q - 1)) / mdcResult;
}

// Função para calcular o expoente público 'e' de acordo com a função λ(n)
function publicExponent(lambdaN, p, q) {
    let e = INITIAL_EXPONENT;
    while (mdc(e, lambdaN).mdc !== 1 && e < lambdaN || (e === p || e === q)) {
        e++;
    }
    return e;
}

// Função para calcular o expoente privado 'd' (inverso modular de 'e')
function privateExponent(e, lambdaN) {
    const result = mdc(e, lambdaN);
    if (result.mdc !== 1) {
        throw new Error('Inverso modular não existe');
    }
    return ((result.x % lambdaN) + lambdaN) % lambdaN; // Garante que o valor seja positivo
}

// Função para criptografar uma mensagem usando a chave pública
function encrypt(message, key) {
    const result = BigInt(message) ** BigInt(key.exp) % BigInt(key.mod);
    return Number(result);
}

// Criptografa toda uma mensagem
function encryptString(text, key) {
    const encryptedValues = [...text].map(char => encrypt(char.charCodeAt(0), key));
    return `(${encryptedValues.join(", ")})`;
}

// Desriptografa toda uma mensagem
function decryptString(encryptedText, key) {
    const values = encryptedText.match(/\d+/g).map(Number);
    const decryptedChars = values.map(num => String.fromCharCode(encrypt(num, key)));
    return decryptedChars.join("");
}

// Formata o uma string no formato (12, 13, 14) em uma string com valores Hexadecimais.
function formatToHex(secret) {
    // Remove os parênteses e divide a string pelos delimitadores de vírgula
    const numbers = secret.slice(1, -1).split(',').map(Number);
    
    // Converte cada número para hexadecimal e junta sem espaços
    const hexString = numbers.map(num => num.toString(16).padStart(4, '0')).join('');
    
    // Adiciona o prefixo 0x
    return `0x${hexString}`;
}

// Formata uma string com valores Hexadecimais em outra no formato (12, 13, 14)
function hexToFormat(hex) {
    // Remove o prefixo 0x, se existir
    const hexWithoutPrefix = hex.startsWith('0x') ? hex.slice(2) : hex;
    
    // Divide a string hexadecimal em grupos de 4 caracteres
    const hexPairs = hexWithoutPrefix.match(/.{1,4}/g) || [];
    
    // Converte cada par hexadecimal para decimal
    const numbers = hexPairs.map(hexPair => parseInt(hexPair, 16));
    
    // Formata a saída no formato (79, 118, 132)
    const formattedString = `(${numbers.join(', ')})`;
    
    return formattedString;
}

// Função para gerar as chaves pública e privada a partir dos números primos p e q
function getKeys(p, q) {
    const n = p * q;
    const lambdaN = carmichaelFunction(p, q);
    const e = publicExponent(lambdaN, p, q);
    const d = privateExponent(e, lambdaN);

    return {
        n: n,
        lambdaN: lambdaN,
        publicKey: {
            exp: e,
            mod: n
        },
        privateKey: {
            exp: d,
            mod: n
        }
    };
}

// Função de validação do formulário
function validateForm(event) {
    event.preventDefault();

    const p = parseInt(document.getElementById('prime1').value);
    const q = parseInt(document.getElementById('prime2').value);
    const solutionCard = document.getElementById('solution-card');
    const message = document.getElementById('message').value.trim();
    const errorMessage = document.getElementById('error-message');

    // Limpar mensagens anteriores
    errorMessage.classList.add('hidden');

    // Validação dos números e do texto
    if (!isPrime(p) || !isPrime(q)) {
        showError("Ambos os números devem ser primos.");
        return;
    }

    if (p === q) {
        showError("Os números devem ser diferentes.");
        return;
    }

    if ((p < MIN_PRIME || p > MAX_PRIME) || (q < MIN_PRIME || q > MAX_PRIME)) {
        showError(`Os números devem ser maiores que ${MIN_PRIME - 1} e menores que ${MAX_PRIME}.`);
        return;
    }

    if (!message) {
        showError("Você deve inserir um texto.");
        return;
    }

    solutionCard.classList.remove('hidden');
    showStepByStep(p, q, message);
}

// Atualiza o passo a passo com base nos valores informados no formulário
function showStepByStep(p, q, message) {
    const keychain = getKeys(p, q);

    console.log(keychain);

    const secret = encryptString(message, keychain.publicKey);
    const encriptedMessage = formatToHex(secret);

    document.getElementById('selected-primes').innerHTML = `p = ${p} ${BLANK_SPACE} q = ${q}`;
    document.getElementById('module-n').innerHTML = `n = p <mo>×</mo> q <br> n = ${p} <mo>×</mo> ${q} <br> n = ${keychain.n}`;
    document.getElementById('public-key').innerHTML = `Chave Pública = (${keychain.publicKey.mod}, ${keychain.publicKey.exp})`;
    document.getElementById('private-key').innerHTML = `Chave Privada = (${keychain.privateKey.mod}, ${keychain.privateKey.exp})`;
    document.getElementById('text-message').innerHTML = `"${message}"`;
    document.getElementById('decript-message').innerHTML = `"${decryptString(secret, keychain.privateKey)}"`;

    let secretMessage = document.querySelectorAll('#secret-message');
    secretMessage.forEach(function (item) {
        item.innerHTML = `${secret}`;
    });

    let criptMessage = document.querySelectorAll('#cript-message');
    criptMessage.forEach(function (item) {
        item.innerHTML = `${encriptedMessage}`;
    });

    document.querySelector('.math-carmichael').textContent = `${keychain.lambdaN}`;

    let mathP = document.querySelectorAll('.math-p');
    mathP.forEach(function (item) {
        item.textContent = `${p}`;
    });

    let mathQ = document.querySelectorAll('.math-q');
    mathQ.forEach(function (item) {
        item.textContent = `${q}`;
    });


    let mathLambda = document.querySelectorAll('.math-lambda');
    mathLambda.forEach(function (item) {
        item.textContent = `${keychain.lambdaN}`;
    });

    let mathE = document.querySelectorAll('.math-e');
    mathE.forEach(function (item) {
        item.textContent = `${keychain.publicKey.exp}`;
    });

    let mathD = document.querySelectorAll('.math-d');
    mathD.forEach(function (item) {
        item.textContent = `${keychain.privateKey.exp}`;
    });

    createASCIITable(message);
    createCriptTable(message, keychain.publicKey);
    createEncriptTable(secret, keychain.privateKey);
}

// Função para exibir uma mensagem de erro
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const solutionCard = document.getElementById('solution-card');

    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    solutionCard.classList.add('hidden');
}

// Adicionar evento de submissão ao formulário
document.getElementById('prime-form').addEventListener('submit', validateForm);

// Valida a mensagem
function validateAscii(event) {
    const input = event.target;
    const value = input.value;
    const asciiRegex = /^[\x20-\x7E]*$/;

    if (!asciiRegex.test(value))
        input.value = value.replace(/[^ -~]/g, '');
}

// Preenche a tabela ASCII
function createASCIITable(message) {
    const tableBody = document.getElementById('ascii-table-body');
    tableBody.innerHTML = "";

    for (let i = 0; i < message.length; i++) {
        const character = message[i];
        const row = document.createElement('tr');
        const cellCharacter = document.createElement('td');
        const cellASCII = document.createElement('td');

        cellCharacter.textContent = character;
        cellCharacter.className = "py-2 px-4";
        cellASCII.textContent = character.charCodeAt(0);
        cellASCII.className = "py-2 px-4";

        row.appendChild(cellCharacter);
        row.appendChild(cellASCII);

        tableBody.appendChild(row);
    }
}

// Cria a tabela de segredos
function createCriptTable(message, key) {
    const tableBody = document.getElementById('cript-table-body');
    tableBody.innerHTML = "";

    for (let i = 0; i < message.length; i++) {
        const character = message[i];
        const asciiValue = character.charCodeAt(0);

        const row = document.createElement('tr');

        const cellMessage = document.createElement('td');
        cellMessage.textContent = asciiValue;
        cellMessage.className = "py-2 px-4";

        const cellCalculation = document.createElement('td');
        const calculation = `${asciiValue}<sup>${key.exp}</sup> mod ${key.mod}`;
        cellCalculation.innerHTML = calculation;
        cellCalculation.className = "py-2 px-4";

        const cellSecret = document.createElement('td');
        const secret = encrypt(asciiValue, key); // Chama a função para gerar o segredo
        cellSecret.textContent = secret.toString(); // Converte para string (caso seja BigInt)
        cellSecret.className = "py-2 px-4";

        row.appendChild(cellMessage);
        row.appendChild(cellCalculation);
        row.appendChild(cellSecret);

        tableBody.appendChild(row);
    }
}

// Adiciona valores à tabela de descriptografia
function addTableRow(secret, calculation, ascii, character) {
    const tbody = document.getElementById('decript-table-body');

    const row = document.createElement('tr');

    const secretCell = document.createElement('td');
    secretCell.textContent = secret;
    secretCell.className = 'py-2 px-4';

    const calculationCell = document.createElement('td');
    calculationCell.innerHTML = calculation; // Use innerHTML to render the exponent
    calculationCell.className = 'py-2 px-4';

    const asciiCell = document.createElement('td');
    asciiCell.textContent = ascii;
    asciiCell.className = 'py-2 px-4';

    const characterCell = document.createElement('td');
    characterCell.textContent = character;
    characterCell.className = 'py-2 px-4';

    row.appendChild(secretCell);
    row.appendChild(calculationCell);
    row.appendChild(asciiCell);
    row.appendChild(characterCell);

    tbody.appendChild(row);
}

// Preenche a tabela de descriptografia
function createEncriptTable(message, key) {
    const values = message.slice(1, -1).split(',').map(Number);

    const tbody = document.getElementById('decript-table-body');
    tbody.innerHTML = '';

    values.forEach((secret) => {
        const ascii = encrypt(secret, key);
        const calculation = `${secret}<sup>${key.exp}</sup> mod ${key.mod}`;
        const character = String.fromCharCode(Number(ascii));
        addTableRow(secret, calculation, ascii, character);
    });
}

// Efeito de scroll na Navbar
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('bg-blue-900');
    } else {
        navbar.classList.remove('bg-blue-900');
    }
});

// Evento para a animação de texto
document.addEventListener("DOMContentLoaded", function () {
    const typedElement = document.querySelector(".typed-out");
    typedElement.addEventListener("animationend", function (event) {
        if (event.animationName === "typing") {
            typedElement.style.overflow = "visible";
        }
    });
});

// Mobile menu toggle
document.getElementById('mobile-menu-button').addEventListener('click', function () {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});
