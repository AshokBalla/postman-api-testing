const path = require('path');
const async = require('async');
const newman = require('newman');
const dotenv = require('dotenv');

// Load .env from the project root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PARALLEL_RUN_COUNT = 1;

// Debug log to check env file loading
console.log('Current directory:', __dirname);
console.log('Env file path:', path.resolve(__dirname, '../../.env'));

// Verify environment variables are loaded
if (!process.env.BASE_URL || !process.env.GRAPHQL_API_KEY_PARTNER || !process.env.GRAPHQL_API_KEY || !process.env.MERCHANT_UID) {
    console.error('Required environment variables are missing. Please check your .env file.');
    console.log('Available environment variables:', process.env);
    process.exit(1);
}

// Create environment object from .env variables in Postman format
const envData = {
    "values": [
        {
            "key": "baseUrl",
            "value": process.env.BASE_URL,
            "enabled": true
        },
        {
            "key": "graphql_api_key_partner",
            "value": process.env.GRAPHQL_API_KEY_PARTNER,
            "enabled": true
        },
        {
            "key": "graphql_api_key",
            "value": process.env.GRAPHQL_API_KEY,
            "enabled": true
        },
        {
            "key": "merchant_uid",
            "value": process.env.MERCHANT_UID,
            "enabled": true
        }
    ]
};

// Log environment variables for debugging
console.log('Environment variables loaded:', {
    baseUrl: process.env.BASE_URL,
    graphql_api_key_partner: process.env.GRAPHQL_API_KEY_PARTNER,
    graphql_api_key: process.env.GRAPHQL_API_KEY,
    merchant_uid: process.env.MERCHANT_UID
});

const parametersForTestRun = [{
    collection: path.join(__dirname, 'merchant_mutations.json'),
    environment: envData,
    reporters: ['cli', 'html', 'csv'],
    reporter: {
        html: { export: './reports/merchant_mutations.html' },
        csv: { export: './reports/merchant_mutations.csv' }
    }
}, {
    collection: path.join(__dirname, 'merchant_queries.json'),
    environment: envData,
    reporters: ['cli', 'html', 'csv'],
    reporter: {
        html: { export: './reports/merchant_queries.html' },
        csv: { export: './reports/merchant_queries.csv' }
    }
}, {
    collection: path.join(__dirname, 'partner_mutations.json'),
    environment: envData,
    reporters: ['cli', 'html', 'csv'],
    reporter: {
        html: { export: './reports/partner_mutations.html' },
        csv: { export: './reports/partner_mutations.csv' }
    }
}, {
    collection: path.join(__dirname, 'partner_queries.json'),
    environment: envData,
    reporters: ['cli', 'html', 'csv'],
    reporter: {
        html: { export: './reports/partner_queries.html' },
        csv: { export: './reports/partner_queries.csv' }
    }
}];

function createNewmanRunCommand(parameters) {
    return function (done) {
        console.log(`Starting collection: ${parameters.collection}`);

        newman.run({
            ...parameters,
            bail: false,
            suppressExitCode: true,
            timeout: 70000,
            timeoutRequest: 30000,
            timeoutScript: 30000
        }, function (err, summary) {
            if (err) {
                console.error('Collection run failed:', err);
            }
            if (summary?.run?.failures?.length) {
                console.log(`Collection completed with ${summary.run.failures.length} failures`);
                console.log('Failures:', JSON.stringify(summary.run.failures, null, 2));
            }
            done(null, summary);
        });
    };
}

// Create reports directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('./reports')) {
    fs.mkdirSync('./reports', { recursive: true });
}

let commands = [];
parametersForTestRun.forEach((parameters) => {
    for (let index = 0; index < PARALLEL_RUN_COUNT; index++) {
        commands.push(createNewmanRunCommand(parameters));
    }
});

async.parallel(
    commands,
    (err, results) => {
        if (err) {
            console.error('Error in parallel execution:', err);
            process.exit(1);
        }

        let totalFailures = 0;
        results.forEach(function (result, index) {
            if (result) {
                const failures = result.run.failures;
                totalFailures += failures.length;
                const collectionName = path.basename(parametersForTestRun[index % parametersForTestRun.length].collection);
                console.info(failures.length ?
                    `Collection ${collectionName} had ${failures.length} failures` :
                    `Collection ${collectionName} ran successfully.`
                );
            } else {
                console.error('A test run did not complete successfully.');
            }
        });

        console.log(`\nTest run completed with ${totalFailures} total failures`);
        if (totalFailures > 0) {
            process.exit(1);
        }
    }
);