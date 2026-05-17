- Customer enter his card number
- Payment gateway collects the data and send to Payment processor
- Payment processor send to Acquirer Bank
- Acquirer Bank send to Card Network
- Card Network send to Issuing Bank
- Issuing bank check the balanace and Risk management
- If balance is enough and no risk
- Issuing Bank send approved to card network
    - Card network send approved to acquirer bank
        - Acquirer Bank send approved to Payment processor
            - Payment processor send approved to Payment gateway
                - Payment gateway show success message to Customer


- If balance is not enough or risk
- Issuing Bank send declined to card network
- Card Network send declined to acquirer bank
- Acquirer Bank send declined to Payment processor
- Payment processor send declined to Payment gateway
- Payment gateway send declined to Customer