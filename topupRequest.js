import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getPickListValues from '@salesforce/apex/TopupPicklistController.getPickListValues';
import recalculateTopUp from '@salesforce/apex/TopUpCalculateEMIAction.recalculateTopUp';
import createTopupAppHandler from '@salesforce/apex/TopupApplyNowActionHandler.createAppCallOut';
import checkEligibilityAura from '@salesforce/apex/TopUpManager.checkEligibilityAura';
import createTopupQuoteHandler from '@salesforce/apex/TopUpCalculateEMIAction.createTopupQuoteHandler';
import getCheckResponse2 from '@salesforce/apex/TopUpManager.getCheckResponse2';



// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// async function delayedGreeting() {
//     await sleep(5000);
// }

export default class TopupRequest extends NavigationMixin(LightningElement) {
    @track isEligible;
    @track noLicense;
    @track updateAddress;
    @track submitHit;
    @track expiryDay;
    @track expiryMonth;
    @track expiryYear;
    @track termOptions;
    @track selectedDrivingNum;
    @track versionNumber;
    @track accId;
    @track accName = '';
    @track repaymentResponse;
    @track topupAmount = '';
    @track outStandingLoanBal = '';
    @track totalLoanAmount = '';
    @track estMonthlyRepayment = '';
    @track topupLef = '';
    @track topupLoanType = '';
    @track irate = '';
    @track error;
    @track freqOptions;
    @track isHit;
    @track renderSection;
    @track fixedProduct;
    @track loaded;
    @track selectedAmount = '0';
    @track selectedTerm = '';
    @track selectedFreq = '';
    @track selectedPurpose = '';
    @track eligibilityResponse;
    @track isMigrated = false;
    @track visibleOptions = [];
    @track showItems;
    @track totalLoanAmtLabel = '';
    @track currentDate;
    @track selectedUnitNo = '';
    @track selectedStreetNum = '';
    @track selectedStreetName = '';
    @track selectedStreetType = '';
    @track selectedCity = '';
    @track selectedState = '';
    @track selectedPostCode = '';
    @track selectedProperty = '';
    @track drivingLicenseCard;
    @track allOptions = [
        'Street', 'Road', 'Avenue', 'Terrace', 'Access', 'Alley', 'Alleyway', 'Amble', 'Anchorage',
        'Approach', 'Arcade', 'Artery', 'Avenue', 'Basin', 'Beach', 'Bend', 'Block', 'Boulevard',
        'Brace', 'Brae', 'Break', 'Bridge', 'Broadway', 'Brow', 'Bypass', 'Byway', 'Causeway', 'Centre',
        'Centreway', 'Chase', 'Circle', 'Circlet', 'Circuit', 'Circus', 'Close', 'Colonnade', 'Common',
        'Concourse', 'Copse', 'Corner', 'Corso', 'Court', 'Courtyard', 'Cove', 'Crescent', 'Crest', 'Cross',
        'Crossing', 'Crossroad', 'Crossway', 'Cruiseway', 'Cul-de-sac', 'Cutting', 'Dale', 'Dell', 'Deviation',
        'Dip', 'Distributor', 'Drive', 'Driveway', 'Edge', 'Elbow', 'End', 'Entrance', 'Esplanade', 'Estate',
        'Expressway', 'Extension', 'Fairway', 'Fire Track', 'Firetrail', 'Flat', 'Follow', 'Footway', 'Foreshore',
        'Formation', 'Freeway', 'Front','Frontage','Gap','Garden','Gardens','Gate','Gates','Glade','Glen','Grange','Green','Ground','Grove','Gully','Heights','Highroad','Highway','Hill','Interchange','Intersection','Junction','Key','Landing','Lane','Laneway','Lees','Line','Link','Little','Lookout','Loop','Lower','Mall','Meander','Mew','Mews','Motorway','Mount','Nook','Outlook','Parade','Park','Parklands','Parkway','Part','Pass','Path','Pathway','Piazza','Place','Plateau','Plaza','Pocket','Point','Port','Promenade','Quad','Quadrangle','Quadrant','Quay','Quays','Ramble','Ramp','Range','Reach','Reserve','Rest','Retreat','Ride','Ridge','Ridgeway','Right of Way','Ring','Rise','River','Riverway','Riviera','Road','Roads','Roadside','Roadway','Ronde','Rosebowl','Rotary','Round','Route','Row','Rue','Run','Service Way','Siding','Slope','Sound','Spur','Square','Stairs','State Highway','Steps','Strand','Street','Strip','Subway','TURN','Tarn','Terrace','Thoroughfare','Tollway','Top','Tor','Towers','Track','Trail','Trailer','Triangle','Trunkway','Underpass','Upper','Vale','Viaduct','View','Villas','Vista','Wade','Walk','Walkway','Way','Wharf','Wynd','Yard'
    ]; // Array to store all the options
    connectedCallback() {
        
        this.agreed = false;
        this.isHit = false;
        this.submitHit = false;
        this.noLicense = false;
        this.updateAddress = false;
        this.showItems = false;
        this.loaded = true;
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        this.currentDate = `${year}-${month}-${day}`;
        getPickListValues({
            objApiName: 'genesis__applications__c',
            fieldName: 'Loan_Term__c'
        })
            .then(data => {
                console.log('picklistValue=>' + JSON.stringify(data));
                this.termOptions = data;
            })
            .catch(error => {
                this.displayError(error);
            });
        getPickListValues({
            objApiName: 'genesis__applications__c',
            fieldName: 'genesis__Payment_Frequency__c'
        })
            .then(data => {
                console.log('picklistValue=>' + JSON.stringify(data));
                this.freqOptions = data;
            })
            .catch(error => {
                this.displayError(error);
            });
        const param = 'accId';
        const paramValue = this.getUrlParamValue(window.location.href, param);
        this.accId = paramValue;
        checkEligibilityAura({ accId: this.accId })
            .then(result => {
                console.log('checkEligibilityAura' + result);
                this.eligibilityResponse = JSON.parse(result);
                this.isEligible = this.eligibilityResponse.isEligible;
                if (!this.isEligible) {
                    this.submitHit = true;
                }
                console.log('checkEligibilityAura On load=> '+ this.isEligible);
            })
            .catch(error => {
                console.log('error' + JSON.stringify(error));
                this.error = JSON.stringify(error);
            });
            getCheckResponse2({ accId: this.accId })
            .then(result => {
                console.log('getCheckResponse2'+result);
                this.eligibilityResponse = JSON.parse(result);
                this.isEligible = this.eligibilityResponse.isEligible;
                if (!this.isEligible) {
                    this.submitHit = true;
                    this.targetUrl = "/c/TopupApp.app?accId=" + this.accId;
                    this.handleNavigation();
                }else{
                    this.fixedProduct = this.eligibilityResponse.productName?.toString().toLowerCase().includes('fixed') ?? false;
                    this.template.querySelector('.res-status').value = this.eligibilityResponse.resStatus?.toString() ?? '';
                    this.selectedResStatus = this.eligibilityResponse.resStatus?.toString() ?? '';
                    // this.selectedHomeaddress = this.eligibilityResponse.hmAdd?.toString() ?? '';
                    this.selectedUnitNo = this.eligibilityResponse.unitNumber ?? '';
                    this.selectedStreetNum = this.eligibilityResponse.streetNo ?? '';
                    this.selectedStreetName = this.eligibilityResponse.streetName ?? '';
                    this.selectedStreetType = this.eligibilityResponse.streetType ?? '';
                    this.selectedCity = this.eligibilityResponse.city ?? '';
                    this.selectedState = this.eligibilityResponse.suburb ?? '';
                    this.selectedPostCode = this.eligibilityResponse.postCode ?? '';
                    this.selectedProperty = this.eligibilityResponse.propertyName ?? '';
                    this.selectedHomeaddress = `${this.selectedStreetNum} ${this.selectedStreetName} ${this.selectedStreetType}, ${this.selectedState} ${this.selectedCity}, NZ`;
                    this.template.querySelector('.home-add').value = this.selectedHomeaddress ?? '';
                    this.quoteExists = this.eligibilityResponse.quoteExists ?? false;
                    if (this.quoteExists) {
                        console.log('quoteExists');
                        this.qqRef = this.eligibilityResponse.qqref ?? '';
                        console.log('this.qqRef'+this.qqRef);
                        this.agreed = true;
                        console.log('this.agreed'+this.agreed);
                        const loanAmount = this.eligibilityResponse.qtTopupAmt?.toString() ?? '';
                        console.log('this.loanAmount'+loanAmount);
                        this.template.querySelector('.loan-amount').value = loanAmount;
                        this.selectedAmount = loanAmount;
                        console.log('this.selectedAmount'+this.selectedAmount);
                        this.template.querySelector('.loan-term').value = this.eligibilityResponse.qtTerms?.toString() ?? '';
                        this.selectedTerm = this.template.querySelector('.loan-term').value;
                        const receivedFreq = this.eligibilityResponse.qtFreq?.toString() ?? '';
                        console.log('receivedFreq'+receivedFreq);
                        this.template.querySelector('.loan-freq').value = receivedFreq === 'Fortnightly' ? 'BI-WEEKLY' : receivedFreq;
                        this.selectedFreq = this.template.querySelector('.loan-freq').value;
                        this.template.querySelector('.loan-purpose').value = this.eligibilityResponse.qtPurpose?.toString() ?? '';
                        this.selectedPurpose = this.template.querySelector('.loan-purpose').value;
                        this.outStandingLoanBal = this.eligibilityResponse.qtOutLoanBal?.toFixed(2) ?? '';
                        this.totalLoanAmount = this.eligibilityResponse.qtTopupTotalLnAmt?.toFixed(2) ?? '';
                        this.estMonthlyRepayment = this.eligibilityResponse.qtRepmtAmt?.toFixed(2) ?? '';
                        this.topupLoanType = this.eligibilityResponse.qtLoanType ?? '';
                        this.irate = this.eligibilityResponse.qtRate?.toString() + ' % p.a.' ?? '';
                        this.isMigrated = this.eligibilityResponse.isMigrated;
                        this.topupLef = this.eligibilityResponse.topupLef;
                        this.totalLoanAmtLabel = this.isMigrated ? 'Total loan amount (Excluding Loan Establishment Fee)': 'Total loan amount (Including fee)' ;
                        this.topupAmount = this.eligibilityResponse.qtTopupAmt.toString() ?? '';
                        this.accName = 'Welcome, ' + this.eligibilityResponse.borrName ?? '';
                        this.template.querySelector('.rate-calculate').textContent = 'Recalculate';
                        this.isHit = true;
                        console.log('quoteExistsisHit'+this.isHit);
                    }
                    this.loaded = false;
                }
            })
            .catch(error => {
                this.error = error;
                console.error(this.error);
                alert(this.error.body.message);
                location.reload();
            });
    }
    getUrlParamValue(url, key) {
        return new URL(url).searchParams.get(key);
    }
    amountHandler(event) {
        this.selectedAmount = event.target.value.replace(/[^0-9.]+/g, '');;
    }
    termHandler(event) {
        this.dispatchEvent(new CustomEvent('selected', {
            detail: event.target.value
        }));
        this.selectedTerm = event.target.value;
    }
    freqHandler(event) {
        this.dispatchEvent(new CustomEvent('selected', {
            detail: event.target.value
        }));
        this.selectedFreq = event.target.value;
    }
    purposeHandler(event) {
        this.dispatchEvent(new CustomEvent('selected', {
            detail: event.target.value
        }));
        this.selectedPurpose = event.target.value;
    }
    resStatusHandler(event) {
        this.dispatchEvent(new CustomEvent('selected', {
            detail: event.target.value
        }));
        this.selectedResStatus = event.target.value;
    }
    hasOrNotDrivingLicense(event) {
        this.noLicense = event.target.checked;
    }
    licenseNumHandler(event){
        this.selectedDrivingNum = event.target.value;
        console.log(this.selectedDrivingNum);
    }
    versionNumberHandler(event){
        this.versionNumber = event.target.value;
        console.log(this.versionNumber);
    }
    expiryDateHandler(event){
        const expiryDateCheck = event.target.value;
        // Create a Date object from the input value (YYYY-MM-DD)
        const [year, month, day] = expiryDateCheck.split('-');
        this.expiryDay = day;
        this.expiryMonth = month;
        this.expiryYear = year;
        console.log(this.expiryDay);
        console.log(this.expiryMonth);
        console.log(this.expiryYear);
    }
    hasOrNotUpdatedAddress(event) {
        this.updateAddress = event.target.checked;
    }
    unitNumHandler(event){
        this.selectedUnitNo = event.target.value;
        console.log('here');
        console.log(this.selectedUnitNo);
    }
    streetNumHandler(event){
        this.selectedStreetNum = event.target.value;
        console.log(this.selectedStreetNum);
    }
    streetNameHandler(event){
        this.selectedStreetName = event.target.value;
        console.log(this.selectedStreetName);
    }
    streetTypeHandler(event){
        this.selectedStreetType = event.target.value;
    }
    cityHandler(event){
        this.selectedCity = event.target.value;
        console.log(this.selectedCity);
    }
    stateHandler(event){
        this.selectedState = event.target.value;
        console.log(this.selectedState);
    }
    postCodeHandler(event){
        this.selectedPostCode = event.target.value;
        console.log(this.selectedPostCode);
    }
    propertyHandler(event){
        this.selectedProperty = event.target.value;
        console.log(this.selectedProperty);
    }
    agreedOrNot(event){
        this.agreed = event.target.checked;
        console.log(this.agreed);
    }
    displayError(error) {
        this.error = 'Unknown error';
        if (Array.isArray(error.body)) {
            this.error = error.body.map(e => e.message).join(', ');
        } else if (typeof error.body.message === 'string') {
            this.error = error.body.message;
        }
    }


    widthFloatHandler(event){
        const classList = event.target.parentNode.classList;
        console.log(event.target.parentNode);
        // classList.add('lgc-highlight');
    }

    handleInputFocus(event) {
        // modify parent to properly highlight visually
        const classList = event.target.parentNode.classList;
        classList.add('lgc-highlight');
    }

    handleInputBlur(event) {
        // modify parent to properly remove highlight
        const classList = event.target.parentNode.classList;
        classList.remove('lgc-highlight');
    }

    handleInputChange(event) {
        this.textValue = event.detail.value;
    }
    getRepaymentDetails() {
        const buttonLabel = this.template.querySelector('.rate-calculate').textContent;
        if (parseFloat(this.selectedAmount) < 1000) {
            alert('Your top up amount should be greater than or equal to 1000');
            location.reload();
            return;
        }
        if (parseFloat(this.selectedAmount) > this.eligibilityResponse.potentialTopUp) {
            alert('Your top up amount should be lesser than or equal to $' + this.eligibilityResponse.potentialTopUp);
            location.reload();
        }
        if (this.selectedFreq === '' || this.selectedPurpose === '' || this.selectedTerm === '') {
            alert('Your top up request is missing some required fields');
            location.reload();
        }
        if ((buttonLabel === 'Get Rate') && this.fixedProduct && !this.noLicense && !(this.selectedDrivingNum && this.expiryDay && this.expiryMonth && this.expiryYear && this.versionNumber)) {
            alert('The identification information is incomplete or missing');
            location.reload();
        }
        if ((buttonLabel === 'Get Rate') && this.updateAddress && !(this.selectedStreetNum && this.selectedStreetName && this.selectedStreetType && this.selectedCity && this.selectedState && this.selectedPostCode)) {
            alert('The address information is incomplete or missing.');
            location.reload();
        }
        if ((buttonLabel === 'Get Rate') && !this.allOptions.includes(this.selectedStreetType)) {
            alert('The selected street type is not recognized or invalid.');
            location.reload();
        }
        if ((buttonLabel === 'Get Rate') && this.fixedProduct && !this.agreed) {
            alert('Please confirm your consent');
            return;
        }
        if ((this.selectedHomeaddress === '') && !this.updateAddress) {
            alert('Please select \'Update address details\' check box and complete the details, prior to proceeding with the top up application');
            location.reload();
        }
        this.submitHit = true;
        this.loaded = true;
        if (buttonLabel === 'Get Rate') {
            this.selectedHomeaddress = `${this.selectedStreetNum} ${this.selectedStreetName} ${this.selectedStreetType}, ${this.selectedState} ${this.selectedCity}, NZ`;
            const personalInfo = {
                'first_Name' : this.eligibilityResponse.borrFirstName,
                'last_Name' : this.eligibilityResponse.lastName,
                'middle_Name' : this.eligibilityResponse.middleName,
                'gender' : this.eligibilityResponse.gender,
                'birthDate' : this.eligibilityResponse.dobDate,
                'birthMonth' : this.eligibilityResponse.dobMonth,
                'birthYear' : this.eligibilityResponse.dobYear,
                'email_Address' : this.eligibilityResponse.borrEmail,
                'confirm_Email_Address' : this.eligibilityResponse.borrEmail,
                'please_specify' : this.eligibilityResponse.pleaseSpecify,
                'mobile_Number' : this.eligibilityResponse.mob
            };
            const loanPurpose = {
                'select_Loan_Purpose1' : this.selectedPurpose
            };
            const loanAmount = {
                'loan_Term' : this.selectedTerm,
                'repayment_Frequency' : this.selectedFreq,
                'loan_Amount' : this.selectedAmount
            };
            const homeadd = {
                'postal_Code' : this.selectedPostCode,
                'unit_Number' : this.selectedUnitNo,
                'street_Number' : this.selectedStreetNum,
                'state_Address' : this.selectedCity,
                'street_Name' : this.selectedStreetName,
                'city' :  this.selectedState,
                'street_Type_Address' : this.selectedStreetType,
                'residential_Status' : this.selectedResStatus,
                'manual_Address_Flag' : this.updateAddress,
                'home_Address' : this.selectedHomeaddress,
                'Property_Name' : this.selectedProperty
            };
            const dl = {
                'i_Dont_Have_A_Drivers_License' : this.fixedProduct ? this.noLicense : true, 
                'driver_License_Number' : this.selectedDrivingNum ?? '',
                'Version_Number' : this.versionNumber ?? '',
                'Valid_to_Date_Medicare' : this.expiryDay ?? '',
                'valid_to_month_medicare' : this.expiryMonth ?? '',
                'valid_to_year_medicare' : this.expiryYear ?? ''
            };
            const postadd = {
                'Postal_address' : this.selectedHomeaddress,
                'Postal_Unit_Number' : this.selectedUnitNo,
                'Postal_Street_Number' : this.selectedStreetNum,
                'Postal_State_Address' : this.selectedState,
                'Postal_Street_Name' : this.selectedStreetName,
                'Postal_City' : this.selectedCity,
                'Postal_Street_Type_Address' : this.selectedStreetType,
                'Po_Gpo_Address_Flag' : false,
                'Postal_Manual_Address_Flag' : false,
                'Postal_Property_Name' : this.selectedProperty,
                'Po_Postal_Code' : this.selectedPostCode,
                'Po_Property_Name' : this.selectedProperty
            };
            const jsonStr = {
                personalInfo,
                loanPurpose,
                loanAmount,
                homeadd,
                postadd,
                dl,
                'consent' : this.fixedProduct ? this.agreed : true,
                'productType' : this.eligibilityResponse.productName,
                'accId' : this.accId
            };
            console.log(JSON.stringify(jsonStr));
            createTopupQuoteHandler({ quoteDetails: JSON.stringify(jsonStr) })
            .then(response => {
                console.log('success response => ' + response);
                // this.repaymentResponse = JSON.parse(response);
                // console.log(this.repaymentResponse);
                // this.outStandingLoanBal = this.repaymentResponse.qtOutLoanBal;
                // this.totalLoanAmount = this.repaymentResponse.qtTopupTotalLnAmt;
                // this.estMonthlyRepayment = this.repaymentResponse.rp;
                // this.topupLoanType = this.repaymentResponse.lntyp;
                // //this.topupLef = this.repaymentResponse.topupLef;
                // this.irate = this.repaymentResponse.irate;
                // this.topupAmount = this.repaymentResponse.qtTopupAmt;
                // this.accName = 'Welcome, ' + this.repaymentResponse.first_name;
                // this.qqRef = this.repaymentResponse.qqref;
                // this.template.querySelector('.rate-calculate').textContent = 'Recalculate';

                // this.isHit = true;
                // this.submitHit = false;
                // this.loaded = false;
                location.reload();

            })
            .catch(error => {
                this.error = error;
                alert(this.error.body.message);
                location.reload();
            });
        }else if (buttonLabel === 'Recalculate') {
            const recalculationPayload = {
                'IndicativeRate' : this.irate?.toString().replace(' % p.a.', ''),
                'Loan_Type' : this.topupLoanType,
                'Repayment' : this.estMonthlyRepayment?.toString().replace('$', ''),
                'Loan_Term' : this.selectedTerm,
                'Loan_Amount' : this.selectedAmount,
                'Repayment_Frequency' : this.selectedFreq
            };
            if (!this.qqRef) {
                alert('Quick quote reference ID not found. Please contact admin.');
                location.reload();
            }
            console.log(JSON.stringify(recalculationPayload));
            console.log(this.qqRef);
            recalculateTopUp({quoteDetails: JSON.stringify(recalculationPayload), qqref: this.qqRef})
            .then(response => {
                this.repaymentResponse = response;
                console.log(this.repaymentResponse);
                this.outStandingLoanBal = this.repaymentResponse.qtOutLoanBal ?? '';
                this.totalLoanAmount = this.repaymentResponse.qtTopupTotalLnAmt ?? '';
                this.estMonthlyRepayment = this.repaymentResponse.rp.toFixed(2);
                this.topupLoanType = this.repaymentResponse.lntyp;
                this.topupLef = this.repaymentResponse.topupLef;
                this.irate = this.repaymentResponse.irate + ' % p.a.';
                this.topupAmount = this.repaymentResponse.qtTopupAmt;
                this.isMigrated = this.repaymentResponse.isMigrated;
                this.totalLoanAmtLabel = this.isMigrated ? 'Total loan amount (Excluding Loan Establishment Fee)': 'Total loan amount (Including fee)' ;
                this.accName = 'Welcome, ' + this.repaymentResponse.first_name;
                this.qqRef = this.repaymentResponse.qqref;

                this.isHit = true;
                this.submitHit = false;
                this.loaded = false;
            })
            .catch(error => {
                this.error = error;
                alert(this.error.body.message);
                location.reload();
            });
        }
    }
    createApp() {
        console.log(this.qqRef);
        this.isHit = false;
        this.submitHit = true;
        this.loaded = true;
        if (parseFloat(this.totalLoanAmount) < 2240) {
            this.loaded = false;
            alert('The total loan amount (excluding the Loan Establishment Fee) must be at least $2,000. Please adjust the top-up amount if you wish to proceed.');
            location.reload();
            return;
        }
        const requestBody = {
            tpLnAmt: this.selectedAmount,
            trm: this.selectedTerm,
            repaymentAmount: parseFloat(this.estMonthlyRepayment),
            lnFrq: this.selectedFreq,
            prps: this.selectedPurpose,
            updateDetails: this.updateAddress,
            accId: this.accId
        };

        console.log('requestbody==>' + JSON.stringify(requestBody));
        createTopupAppHandler({ jsonRequest: JSON.stringify(requestBody) })
            .then(responseBody => {
                console.log('responseBody==>' + responseBody);
                this.loaded = false;
                window.location.assign("/apex/CreateTopupApplication?id=" + JSON.parse(responseBody).topupAppId);
            })
            .catch(error => {
                this.error = error;
                alert(this.error.body.message);
                location.reload();
            });
    }
    handleDropdownClick() {
        this.showItems = !this.showItems;
        // const dropdownList = this.template.querySelector('.dropdown-list');
        // dropdownList.classList.toggle('slds-dropdown');
    }

    handleOptionClick(event) {
        const selectedOption = event.target.textContent;
        const dropdownInput = this.template.querySelector('.dropdown-input');
        dropdownInput.value = selectedOption;
        this.selectedStreetType = selectedOption;
        console.log(this.selectedStreetType);

        const dropdownList = this.template.querySelector('.dropdown-list');
        dropdownList.classList.remove('slds-dropdown');
    }
    handleNavigation() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: this.targetUrl
            },
            state: {
                accId: this.accId
            }
        });
    }
}
