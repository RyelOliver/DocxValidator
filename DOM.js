const { isNil } = require('./Utility');
const XML = require('./XML');

const IGNORE_NODE = [ '#text' ];

function parsePredicates (predicates) {
    return predicates.reduce((predicates, predicate) => {
        if (predicate.match(/\[.*\/.*\]/)) {
            return predicates.concat(parse(predicate.match(/\[(.*)\]/)[1]));
        } else if (predicate.match(/\[(\d+)\]/)) {
            const order = parseInt(predicate.match(/\[(\d+)\]/)[1]);
            return predicates.concat([ { order } ]);
        } else if (predicate.match(/\[@(.*)=(.*)\]/)) {
            let [ , name, value ] = predicate.match(/\[@(.*)=(.*)\]/);
            value = value.match(/"(.*)"/) ? value.match(/"(.*)"/)[1] : value;
            return predicates.concat([ { attribute: { name, value } } ]);
        } else if (predicate.match(/\[@(.*)\]/)) {
            const name = predicate.match(/\[@(.*)\]/)[1];
            return predicates.concat([ { attribute: { name } } ]);
        }
        throw Error(`Unable to parse predicate \`${predicate}\`.`);
    }, []);
}

function getFirstSelector (xPath) {
    let end = 0;
    let found = false;
    let predicate = 0;
    while (!found && end < xPath.length) {
        end++;
        const char = xPath[end];
        switch (char) {
            case '[':
                predicate++;
                break;
            case ']':
                predicate--;
                break;
            case '/':
                if (end > 1 && predicate === 0)
                    found = true;
                break;
            default:
                break;
        }
    }
    return xPath.substring(0, end);
}

function splitIntoSelectors (xPath) {
    const selectors = [];
    while (xPath.includes('/')) {
        const selector = getFirstSelector(xPath);
        selectors.push(selector);
        xPath = xPath.substring(selector.length);
    }
    return selectors;
}

function parseSelector (selector) {
    const attributeName = selector.match(/^\/@(.+)$/);
    if (attributeName)
        return { attributeName: [ attributeName[1] ] };

    const direct = !!selector.match(/^\/[^/]+/);
    selector = direct ?
        selector.match(/^\/(.*)/)[1] :
        selector.match(/^\/\/(.*)/)[1];

    let predicates = [];
    if (selector.match(/\[.*?\]/g)) {
        predicates = parsePredicates(selector.match(/\[.*?\]/g));
        selector = selector.match(/(.*?)\[/)[1];
    }

    return {
        childNode: {
            nodeName: [ selector ],
            direct,
            predicates,
        },
    };
}

function parse (xPath) {
    return splitIntoSelectors(xPath)
        .map(parseSelector);
}

function select ({ attributeName = [], childNode: { nodeName, direct, predicates } }) {
    return {
        from: function (nodes) {
            const any = !!nodeName.find(nodeName => nodeName === '*');

            if (attributeName.length > 0) {
                nodes = nodes.map(node => {
                    const values = attributeName.reduce((values, name) => {
                        return values.concat(node.getAttribute(name));
                    }, []);

                    return values.length === 1 ? values[0] :  values;
                });
            } else {
                if (direct) {
                    nodes = nodes.reduce((nodes, node) => {
                        return nodes.concat(Array.from(node.childNodes));
                    }, []);
                    if (!any)
                        nodes = nodes.filter(node => nodeName.includes(node.nodeName));
                } else {
                    nodes = nodes.reduce((nodes, node) => {
                        return nodes.concat(
                            Array.from(node.getElementsByTagName(any || nodeName.length > 1 ? '*' : nodeName[0]))
                        );
                    }, []);
                    if (!any && nodeName.length > 1)
                        nodes = nodes.filter(node => nodeName.includes(node.nodeName));
                }

                nodes = nodes.filter(node => !IGNORE_NODE.includes(node.nodeName));

                predicates.forEach(predicate => {
                    nodes = nodes.filter((node, index) => {
                        if (predicate.order)
                            return predicate.order === index + 1;

                        if (predicate.attribute) {
                            if (isNil(predicate.attribute.value)) {
                                return node.getAttribute(predicate.attribute.name);
                            }
                            return node.getAttribute(predicate.attribute.name) === predicate.attribute.value;
                        }

                        if (predicate.childNode) {
                            const children = select(predicate).from([ node ]);
                            return children.length > 0;
                        }

                        return false;
                    });
                });
            }

            return nodes;
        },
    };
}

function query ({ xPath, node, first, all }) {
    const selectors = parse(xPath);
    let nodes = [ node ];

    selectors.forEach(selector => {
        nodes = select(selector).from(nodes);
    });

    return all ?
        nodes :
        first ?
            nodes[0] :
            nodes[nodes.length - 1];
}

const xPath = {
    parse,
    query,
};

function Query ({ xPath, node, first, all }) {
    let _xPath = xPath;
    let _node = node;
    let _first = first;
    let _all = all;

    function execute () {
        _first = isNil(_first) ? true : _first;
        return query({ xPath: _xPath, node: _node, first: _first, all: _all });
    }

    return {
        within: function (node) {
            if (!isNil(_node))
                throw Error('Query scope already set.');

            _node = node;
            return isNil(_xPath) ? this : execute();
        },
        get: function (xPath) {
            if (!isNil(_xPath))
                throw Error('Query xPath already set.');

            _xPath = xPath;
            return isNil(_node) ? this : execute();
        },
        first: function () {
            if (!isNil(_first) || !isNil(_all))
                throw Error('Query limit already set.');

            _first = true;
            return this;
        },
        last: function () {
            if (!isNil(_first) || !isNil(_all))
                throw Error('Query limit already set.');

            _first = false;
            return this;
        },
        all: function () {
            if (!isNil(_first) || !isNil(_all))
                throw Error('Query limit already set.');

            _all = true;
            return this;
        },
        getFirst: function (xPath) {
            return this.first() && this.get(xPath);
        },
        getLast: function (xPath) {
            return this.last() && this.get(xPath);
        },
        getAll: function (xPath) {
            return this.all() && this.get(xPath);
        },
    };
}

function get (xPath) {
    return Query({ xPath });
}

function getFirst (xPath) {
    return Query({ xPath, first: true });
}

function getLast (xPath) {
    return Query({ xPath, first: false });
}

function getAll (xPath) {
    return Query({ xPath, all: true });
}

function within (node) {
    return Query({ node });
}

function stringifyAttributes (node) {
    const attributes = Array.from(node.attributes)
        .map(attribute => `${attribute.name}="${attribute.value}"`);

    if (attributes.length === 0)
        return '';

    return ` ${attributes.join(' ')}`;
}

function stringifyChildren (node) {
    return Array.from(node.childNodes)
        .filter(node => !IGNORE_NODE.includes(node.nodeName))
        .map(node => stringify(node))
        .join('');
}

function stringify (node) {
    if (IGNORE_NODE.includes(node.nodeName))
        return '';

    if (node.childNodes.length === 0)
        return `<${node.nodeName}${stringifyAttributes(node)}/>`;

    const xml = `<${node.nodeName}${stringifyAttributes(node)}>${stringifyChildren(node)}</${node.nodeName}>`;
    return XML.format(xml);
}

const DOM = {
    xPath,
    within,
    get,
    getFirst,
    getLast,
    getAll,
    stringify,
};

module.exports = DOM;