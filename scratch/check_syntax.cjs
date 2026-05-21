const fs = require('fs');
const babel = require('@babel/core');

try {
    const code = fs.readFileSync('c:/TouringDiary/src/components/layout/Sidebar.tsx', 'utf8');
    babel.parse(code, {
        filename: 'Sidebar.tsx',
        presets: [
            require.resolve('@babel/preset-react'),
            require.resolve('@babel/preset-typescript')
        ],
        plugins: [
            [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
            require.resolve('@babel/plugin-proposal-class-properties')
        ]
    });
    console.log('No syntax errors found.');
} catch (err) {
    console.error('Syntax error found:');
    console.error(err.message);
    process.exit(1);
}
