'use strict';

/**
 * Телефонная книга
 */
const phoneBook = new Map();

/**
 * Вызывайте эту функцию, если есть синтаксическая ошибка в запросе
 * @param {number} lineNumber – номер строки с ошибкой
 * @param {number} charNumber – номер символа, с которого запрос стал ошибочным
 */
function syntaxError(lineNumber, charNumber) {
    throw new Error(`SyntaxError: Unexpected token at ${lineNumber}:${charNumber}`);
}

/**
 * Создает новый контакт
 * @param {string} name
 */
function createContact(name) {
    if (phoneBook.has(name)) {
        return;
    }

    let contact = {
        name: name,
        phoneNumber: [],
        email: [],

        includes: function (query) {
            let isSuit = false;
            isSuit = isSuit || contact.name.includes(query);
            for (let phone of contact.phoneNumber) {
                isSuit = isSuit || phone.includes(query);
            }
            for (let email of contact.email) {
                isSuit = isSuit || email.includes(query);
            }

            return isSuit;
        },

        toString: function (fields) {
            let contactInf = [];
            for (let field of fields) {
                if (field === 'имя') {
                    contactInf.push(contact.name);
                }
                if (field === 'телефоны') {
                    let formatPhone = contact.phoneNumber.map((phone) => {
                        return `+7 (${
                            phone.slice(0, 3)}) ${
                            phone.slice(3, 6)}-${
                            phone.slice(6, 8)}-${
                            phone.slice(8)}`;
                    });
                    contactInf.push(formatPhone.join(','));
                }
                if (field === 'почты') {
                    contactInf.push(contact.email.join(','));
                }
            }

            return contactInf.join(';');
        }
    };
    phoneBook.set(name, contact);
}

/**
 * Удаляет уже существующий контакт
 * @param {string} name
 */
function deleteContact(name) {
    if (phoneBook.has(name)) {
        phoneBook.delete(name);
    }
}

/**
 * Добавляет в массив array только новые значения из elements
 * @param {array} array
 * @param {array} elements
 */
function addUnique(array, elements) {
    for (let i = 0; i < elements.length; i++) {
        if (elements[i] in array) {
            continue;
        }
        array.push(elements[i]);
    }
}

/**
 * Добавляет телефоны phone и почты email в контакт name
 * @param {string} name
 * @param {array} phone
 * @param {array} email
 */
function addInformationsToContact(name, phone, email) {
    if (!phoneBook.has(name)) {
        return;
    }

    let contact = phoneBook.get(name);
    addUnique(contact.phoneNumber, phone);
    addUnique(contact.email, email);
}

/**
 * Удаляет элементы elements из массива array
 * @param {array} array
 * @param {string} elements
 */
function deleteElements(array, elements) {
    for (let i = 0; i < elements.length; i++) {
        if (array.includes(elements[i])) {
            let index = array.indexOf(elements[i]);
            array.splice(index, 1);
        }
    }
}

/**
 * Удаляет телефоны phone и почты email у контакта name
 * @param {string} name
 * @param {array} phone
 * @param {array} email
 */
function deleteInformationsFromContact(name, phone, email) {
    if (!phoneBook.has(name)) {
        return;
    }
    let contact = phoneBook.get(name);
    deleteElements(contact.phoneNumber, phone);
    deleteElements(contact.email, email);

}

/**
 * Находит контакт в телефон, почту или имя которого входит подстрока query
 * @param {string} query
 * @returns {Array}
 */
function findContact(query) {
    if (query === '') {
        return [];
    }

    let result = [];
    for (let contact of phoneBook.values()) {
        if (contact.includes(query)) {
            result.push(contact);
        }
    }

    return result;
}

/**
 * Удаляет контакт в телефоне, почте или имени которого содержится query
 * @param {string} query
 */
function deleteContactWithQuery(query) {
    let contacts = findContact(query);
    for (let contact of contacts) {
        phoneBook.delete(contact.name);
    }
}

function indexesOf(word, subword) {
    let indexes = [];
    let count = 0;
    let index = word.indexOf(subword);
    while (index !== -1) {
        indexes.push(index + count);
        count = count + index + 1;
        word = word.slice(index + 1);
        index = word.indexOf(subword);
    }

    return indexes;
}

function indexesOfArray(array, element) {
    let indexes = [];
    for (let i = 0; i < array.length; i++) {
        if (array[i] === element) {
            indexes.push(i);
        }
    }

    return indexes;
}

function checkEndCommands(queries) {
    if (queries[queries.length - 1] !== '') {
        syntaxError(queries.length, queries[queries.length - 1].length + 1);
    }
}

function checkEndCommand(i, query) {
    let mark = /[0-9А-Яа-я_]+(Создай|Удали|Покажи|Добавь)/i.exec(query);
    if (mark) {
        syntaxError(i + 1,
            mark.index + /(Создай|Удали|Покажи|Добавь)/i.exec(mark[0]).index + 1);
    }
}

function checkRegister(i, query) {
    if (! /^[А-Я]/.test(query)) {
        syntaxError(i + 1, 1);
    }
}

function checkSpace(i, query) {
    if (query.indexOf('  ') !== -1 && query.indexOf('  ') < query.indexOf('есть')) {
        syntaxError(i + 1, query.indexOf('  ') + 2);
    }
}

function checkData(i, query, field, format) {
    let words = query.split(' ');
    let indexesOfArr = indexesOfArray(words, field);
    let indexesOfStr = indexesOf(query, field);
    for (let j = 0; j < indexesOfArr.length; j++) {
        if (! format.test(words[indexesOfArr[j] + (field === 'телефон' ? 1 : 2)])) {
            syntaxError(i + 1, indexesOfStr[j] + 1 + field.length + 1);
        }
    }
}

function checkSyntax(queries) {
    checkEndCommands(queries);

    for (let i = 0; i < queries.length - 1; i++) {
        let query = queries[i];

        checkRegister(i, query);
        checkEndCommand(i, query);
        checkSpace(i, query);
        checkData(i, query, 'телефон', /^\d{10}$/);
        checkData(i, query, 'почту', /^(и|для)$/);
    }

}

function insertInformation(words) {
    let phone = [];
    let email = [];
    let indexesPhone = indexesOfArray(words, 'телефон');
    for (let index of indexesPhone) {
        phone.push(words[index + 1]);
    }
    let indexesEmail = indexesOfArray(words, 'почту');
    for (let index of indexesEmail) {
        email.push(words[index + 1]);
    }

    return { phone, email };
}

function queryProcessing(query, answer) {
    let argIndex = query.indexOf('есть ') + 'есть '.length;
    let arg = query.slice(argIndex);
    let contacts = findContact(arg);
    let fields = (query.slice(7, query.indexOf(' для'))).split(' и ');

    for (let contact of contacts) {
        answer.push(contact.toString(fields));
    }
}

function deleteWithQuery(command) {
    let argIndex = command.indexOf('есть ') + 1 + 'есть '.length;
    let arg = command.slice(argIndex);
    deleteContactWithQuery(arg);
}

function changeContact(command, name) {
    if (command === 'Создай') {
        createContact(name);
    } else {
        deleteContact(name);
    }
}

function runCommand(command, answer) {
    let words = command.split(' ');
    let name = words[words.length - 1];
    let inf = insertInformation(words);
    switch (true) {
        case /^(Создай|Удали) контакт [А-Яа-я_]+/.test(command): {
            changeContact(words[0], name);

            return true;
        }
        case /^Добавь (телефон|почту)/.test(command): {
            addInformationsToContact(name, inf.phone, inf.email);

            return true;

        }
        case /Удали (телефон|почту)/.test(command): {
            deleteInformationsFromContact(name, inf.phone, inf.email);

            return true;
        }
        case /^Покажи/.test(command): {
            queryProcessing(command, answer);

            return true;
        }
        case /^Удали контакты/.test(command): {
            deleteWithQuery(command);

            return true;
        }
        default: {

            return false;
        }
    }
}

/**
 * Выполнение запроса на языке pbQL
 * @param {string} query
 * @returns {string[]} - строки с результатами запроса
 */
function run(query) {
    let answers = [];

    let queries = query.split(';');
    checkSyntax(queries);
    for (let i = 0; i < queries.length - 1; i++) {
        if (! runCommand(queries[i], answers)) {
            syntaxError(i + 1, 1);
        }
    }

    return answers;
}

module.exports = { phoneBook, run };
