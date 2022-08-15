//* prepare references to doc elements
const payBalanceElement = document.getElementById('payment-amount');
const bankBalanceElement = document.getElementById('balance-amount');
const outstandingLoanElement = document.getElementById('loan-amount');
const outstandingLoanTextElement = document.getElementById('loan-text');
const computerPriceElement = document.getElementById('computer-price');
const computerTitleElement = document.getElementById('computer-name');
const computerDescriptionElement = document.getElementById('computer-details');

const workButtonElement = document.getElementById('work-button');
const loanButtonElement = document.getElementById('loan-button');
const bankButtonElement = document.getElementById('bank-button');
const repayButtonElement = document.getElementById('repay-button');
const buyButtonElement = document.getElementById('buy-button');

const computerSelectElement = document.getElementById('computer-select');
const computerSpecsElement = document.getElementById('computer-specs');

const computerImageElement = document.getElementById('computer-image');

//* global variables
let payment = 0;
let balance = 0;
let outstandingLoan = 0;
let hasLoan = false;
let computers = [];
let computerPrice = 0;

//* hide loan elements on start
outstandingLoanElement.style.display = 'none';
outstandingLoanTextElement.style.display = 'none';
repayButtonElement.style.display = 'none';

// fetch data from endpoint
fetch('https://noroff-komputer-store-api.herokuapp.com/computers')
	.then((response) => response.json().then())
	.then((data) => (computers = data))
	.then((computers) => addComputersToList(computers));

const addComputersToList = (computers) => {
	[title, description, price, specs, image] = [
		computers[0].title,
		computers[0].description,
		computers[0].price,
		computers[0].specs,
		computers[0].image,
	];

	// creating a new option for each computer in select list
	computers.forEach((computer) => addComputerToList(computer));

	// update various text elements and image
	updateVisualElements(specs, image, title, description, price);

	// store price of computer for purchase
	computerPrice = price;
};

const addComputerToList = (computer) => {
	// some entries without necessary data... checking if it has necessary data
	if (computer.title && computer.description && computer.price && computer.specs && computer.image) {
		const computerElement = document.createElement('option');
		computerElement.value = computer.id;
		computerElement.appendChild(document.createTextNode(computer.title));
		computerSelectElement.appendChild(computerElement);
	}
};

const updateVisualElements = (specs, image, title, description, price) => {
	addSpecsToList(specs);
	addImageToShowcase(image);
	updateComputerShowcase(title, description, price);
};

const addSpecsToList = (specs) => {
	computerSpecsElement.innerText = '';
	specs.forEach((spec) => {
		const specElement = document.createElement('li');
		specElement.appendChild(document.createTextNode(spec));
		computerSpecsElement.appendChild(specElement);
		console.log(spec);
	});
};

const addImageToShowcase = (image) => {
	const http = new XMLHttpRequest();
	const url = `https://noroff-komputer-store-api.herokuapp.com/${image}`;
	http.open('GET', url, false);
	http.send();
	// Check if image is found
	if (http.status == 404) {
		// Try other browser supported image extensions...
		tryGetImage(url);
	} else {
		computerImageElement.src = url;
	}
};

const tryGetImage = (url) => {
	const BreakException = {};
	const http = new XMLHttpRequest();
	let newUrl = url.toString();
	let imageExtensions = ['jpg', 'png', 'gif', 'svg', 'bmp'];
	newUrl = newUrl.slice(0, -3);
	try {
		imageExtensions.forEach((extension) => {
			const tryUrl = newUrl + extension;
			http.open('GET', tryUrl, false);
			http.send();
			// check if image is found
			if (http.status != 404) {
				computerImageElement.src = tryUrl;
				throw BreakException;
			} else {
				// if no image is found, use placeholder image
				computerImageElement.src = '/Komputer-Store/computer_placeholder.jpg';
			}
		});
	} catch (e) {
		if (e !== BreakException) throw e;
	}
};

const updateComputerShowcase = (title, description, price) => {
	computerTitleElement.innerText = title;
	computerDescriptionElement.innerText = description;
	computerPriceElement.innerText = `${price} NOK`;
};

// handle change of computer in select element
const handleComputerListChange = (element) => {
	const selectedComputer = computers[element.target.selectedIndex];
	[title, description, price, specs, image] = [
		selectedComputer.title,
		selectedComputer.description,
		selectedComputer.price,
		selectedComputer.specs,
		selectedComputer.image,
	];

	// updating various text elements and image
	updateVisualElements(specs, image, title, description, price);

	// storing computer price for purchase
	computerPrice = price;
};

// add 100 kr. to payment balance on click
const doWork = () => {
	console.log('Doing work');
	payment += 100;
	payBalanceElement.innerText = `${payment} kr.`;
};

const getLoan = () => {
	if (hasLoan) {
		// check if user already has a loan
		alert(`You already have an outstanding loan of ${outstandingLoan} kr. that must first be repayed.`);
		return;
	}
	// check if user has sufficient balance to take a loan
	if (balance == 0) {
		alert(`You may not take out a loan without any account balance`);
	} else {
		const loanAmount = parseInt(
			prompt(
				// get loan amount from user
				`Please enter the amount of money you wish to loan. As your current bank balance is: ${balance} kr. you are unable to loan more than ${
					balance / 2
				} kr.`
			)
		);

		// check if amount is valid
		if (!loanAmount) alert('Please enter a valid number.');

		if (loanAmount)
			if (loanAmount > balance / 2) {
				alert(`You tried to loan ${loanAmount} kr. You can not loan more than ${balance / 2} kr.`);
			} else {
				// if amount is valid, process loan
				balance += parseInt(loanAmount);
				hasLoan = true;
				outstandingLoan = loanAmount;
				alert(`You have successfully loaned: ${loanAmount} kr. Your new balance is: ${balance} kr.`);

				// update balance, pay and loan elements
				updateAmounts();
			}
	}
};

const bankPayment = () => {
	let rememberLoan = 0;
	// check if user already has a loan
	if (hasLoan) {
		alert(
			`As you have an outstanding loan 10% of your transfer has been used for repayment.
        Bank transfer = ${payment} kr. -10% = ${payment * 0.9} kr.
        ${payment * 0.1} kr. have been used for repayment of loan.`
		);
		// subtract 10% of bank payment for loan
		rememberLoan = outstandingLoan;
		outstandingLoan -= payment * 0.1;
		payment *= 0.9;
	}

	balance += payment;

	// check if user has negative outstanding loan balance and reimburse them
	reimburse(rememberLoan, false);

	payment = 0;

	// update balance, pay and loan elements
	updateAmounts();
};

const repayLoan = () => {
	const rememberLoan = outstandingLoan;
	outstandingLoan -= payment;

	// check if outstanding loan value is negative and reimburse user balance if needed
	outstandingLoan >= 0 ? reimburse(rememberLoan, false) : reimburse(rememberLoan, true);

	updateAmounts();
};

const reimburse = (loan, showMessage) => {
	// remember payment for reimbursement message
	const rememberPayment = parseInt(payment);
	if (showMessage) {
		alert(
			`${payment} kr. has gone toward the repayment of your ${loan} kr. loan. The remaining ${
				payment - loan
			} kr. has been added to your account balance.`
		);
	}
	// reimburse user for overpayment
	if (outstandingLoan < 0) {
		if (!showMessage) {
			alert(
				`An additional ${-parseInt(
					outstandingLoan
				)} kr. has been added to your account balance as you overpaid, as you paid ${
					loan + -parseInt(outstandingLoan)
				} kr. on a ${loan} kr. loan. Total amount transfered to account = ${
					payment + -parseInt(outstandingLoan)
				} kr.`
			);
		}
		balance -= parseInt(outstandingLoan);
		outstandingLoan = 0;
	}
	if (outstandingLoan == 0) {
		hasLoan = false;
	}
	payment = 0;
};

const buyComputer = () => {
	if (balance >= computerPrice) {
		alert(`Congratulations, you are the proud new owner of a ${computerTitleElement.innerText}`);
		// deduct computer price from balance
		balance -= computerPrice;
	} else {
		alert(
			`You can not afford this computer. Your balance is: ${balance} kr., while the computer costs ${computerPrice} kr.`
		);
	}
	// update various amounts
	updateAmounts();
};

const updateAmounts = () => {
	// update text elements with new balance
	bankBalanceElement.innerText = `${balance.toFixed(2)} kr.`;
	payBalanceElement.innerText = `${payment.toFixed(2)} kr.`;
	outstandingLoanElement.innerText = `${outstandingLoan.toFixed(2)} kr.`;

	// hide or show loan elements depending on wether there is a loan or not
	if (outstandingLoan == 0) {
		outstandingLoanElement.style.display = 'none';
		outstandingLoanTextElement.style.display = 'none';
		repayButtonElement.style.display = 'none';
	} else {
		outstandingLoanElement.style.display = 'block';
		outstandingLoanTextElement.style.display = 'block';
		repayButtonElement.style.display = 'block';
	}
};

// add event listeners
workButtonElement.addEventListener('click', doWork);
loanButtonElement.addEventListener('click', getLoan);
bankButtonElement.addEventListener('click', bankPayment);
repayButtonElement.addEventListener('click', repayLoan);
computerSelectElement.addEventListener('change', handleComputerListChange);
buyButtonElement.addEventListener('click', buyComputer);
