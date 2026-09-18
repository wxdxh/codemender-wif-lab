const adminService = require('../../services/admin.service');

exports.checkShippingStatus = (req, res) => {
    adminService.pingProvider(req.body.providerIP, req.body.options, out => res.send(out));
};

function evaluateSafeFormula(formula) {
    if (typeof formula !== 'string' || !/^[0-9+\-*/().\s]+$/.test(formula)) {
        throw new Error('Invalid formula');
    }
    const tokens = formula.match(/\d+(?:\.\d+)?|[+\-*/()]/g);
    if (!tokens) throw new Error('Empty formula');
    let pos = 0;
    function parseExpr() {
        let val = parseTerm();
        while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
            const op = tokens[pos++];
            const right = parseTerm();
            val = op === '+' ? val + right : val - right;
        }
        return val;
    }
    function parseTerm() {
        let val = parseFactor();
        while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
            const op = tokens[pos++];
            const right = parseFactor();
            if (op === '/' && right === 0) throw new Error('Division by zero');
            val = op === '*' ? val * right : val / right;
        }
        return val;
    }
    function parseFactor() {
        if (tokens[pos] === '(') {
            pos++;
            const val = parseExpr();
            if (tokens[pos++] !== ')') throw new Error('Mismatched parentheses');
            return val;
        }
        const num = Number(tokens[pos++]);
        if (Number.isNaN(num)) throw new Error('Invalid number');
        return num;
    }
    const result = parseExpr();
    if (pos !== tokens.length) throw new Error('Unexpected token');
    return result;
}

exports.previewDynamicPricing = (req, res) => {
    try {
        res.json({ price: evaluateSafeFormula(req.body.formula) });
    } catch (e) {
        res.status(400).send("Evaluation Failed");
    }
};