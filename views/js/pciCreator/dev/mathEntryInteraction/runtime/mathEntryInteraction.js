define([
    'qtiCustomInteractionContext',
    // fixme: embed jQuery 1.4.3+ or update PCI jQuery version - remove jQuery shared lib dependency
    'jquery',
    'OAT/lodash',
    'OAT/util/event',
    'OAT/util/html',
    // fixme: use a relative path from PCI runtime
    'qtiItemPci/pciCreator/dev/mathEntryInteraction/runtime/mathquill/mathquill'
], function(
    qtiCustomInteractionContext,
    $,
    _,
    event,
    html,
    MathQuill
){
    'use strict';

    var mathEntryInteraction = {

        render: function render(config) {
            this.initConfig(config);

            this.createToolbar();
            this.createMathField();
        },

        /**
         *
         * @param {Object} config
         * @param {Boolean} config.tool_toolId - is the given tool enabled?
         */
        initConfig: function init(config) {
            function toBoolean(value, defaultValue) {
                if (typeof(value) === "undefined") {
                    return defaultValue;
                } else {
                    return (value === true || value === "true");
                }
            }

            this.config = {
                toolsStatus: {
                    frac:   toBoolean(config.tool_frac,     true),
                    sqrt:   toBoolean(config.tool_sqrt,     true),
                    exp:    toBoolean(config.tool_exp,      true),
                    log:    toBoolean(config.tool_log,      true),
                    ln:     toBoolean(config.tool_ln,       true),
                    e:      toBoolean(config.tool_e,        true),
                    pi:     toBoolean(config.tool_pi,       true),
                    cos:    toBoolean(config.tool_cos,      true),
                    sin:    toBoolean(config.tool_sin,      true),
                    lte:    toBoolean(config.tool_lte,      true),
                    gte:    toBoolean(config.tool_gte,      true),
                    times:  toBoolean(config.tool_times,    true),
                    divide: toBoolean(config.tool_divide,   true)
                }
            };
        },

        createMathField: function() {
            var self = this,
                MQ = MathQuill.getInterface(2);

            this.mathField = MQ.MathField(this.$input.get(0), {
                spaceBehavesLikeTab: true,
                handlers: {
                    edit: function() {
                        self.trigger('responseChange');
                    }
                }
            });
        },

        createToolbar: function() {
            var self = this,
                availableTools = {
                    frac:   { label: 'x/y',         latex: '\\frac',    fn: 'cmd',      desc: 'Fraction' },
                    sqrt:   { label: '&radic;',     latex: '\\sqrt',    fn: 'cmd',      desc: 'Square root' },
                    exp:    { label: 'x&#8319;',    latex: '^',         fn: 'cmd',      desc: 'Exponent' },
                    log:    { label: 'log',         latex: '\\log',     fn: 'write',    desc: 'Log' },
                    ln:     { label: 'ln',          latex: '\\ln',      fn: 'write',    desc: 'Ln' },
                    e:      { label: '&#8494;',     latex: '\\mathrm{e}',fn: 'write',   desc: 'Euler\'s constant' },
                    pi:     { label: '&pi;',        latex: '\\pi',      fn: 'write',    desc: 'Pi' },
                    cos:    { label: 'cos',         latex: '\\cos',     fn: 'write',    desc: 'Cosinus' },
                    sin:    { label: 'sin',         latex: '\\sin',     fn: 'write',    desc: 'Sinus' },
                    lte:    { label: '&le;',        latex: '\\le',      fn: 'write',    desc: 'Lower than or equal' },
                    gte:    { label: '&ge;',        latex: '\\ge',      fn: 'write',    desc: 'Greater than or equal' },
                    times:  { label: '&times;',     latex: '\\times',   fn: 'cmd',      desc: 'Multiply' },
                    divide: { label: '&divide;',    latex: '\\div',     fn: 'cmd',      desc: 'Divide' }
                },
                availableToolGroups = {
                    functions:  ['sqrt', 'frac', 'exp', 'log', 'ln', 'e'],
                    trigo:      ['pi', 'sin', 'cos'],
                    comparison: ['lte', 'gte'],
                    operands:   ['times', 'divide']
                };


            this.$toolbar.empty();

            // create buttons
            this.$toolbar.append(createToolGroup('functions'));
            this.$toolbar.append(createToolGroup('trigo'));
            this.$toolbar.append(createToolGroup('comparison'));
            this.$toolbar.append(createToolGroup('operands'));

            function createToolGroup(groupId) {
                var $toolGroup = $('<div>', {
                        'class': 'math-entry-toolgroup',
                        'data-identifier': groupId
                    }),
                    activeTools = 0;

                availableToolGroups[groupId].forEach(function(toolId) {
                    var toolConfig = availableTools[toolId];

                    toolConfig.id = toolId;
                    if (self.config.toolsStatus[toolId] === true) {
                        $toolGroup.append(createTool(toolConfig));
                        activeTools++;
                    }
                });

                return (activeTools > 0) ? $toolGroup : '';
            }

            function createTool(config) {
                return $('<div>', {
                    'class': 'math-entry-tool',
                    'data-identifier': config.id,
                    'data-latex': config.latex,
                    'data-fn': config.fn,
                    html: config.label
                });
            }

            // add behaviour

            this.$toolbar.off('mousedown.qtiCommonRenderer');
            this.$toolbar.on('mousedown.qtiCommonRenderer', function(e) {
                var $target = $(e.target),
                    fn = $target.data('fn'),
                    latex = $target.data('latex');

                e.stopPropagation();
                e.preventDefault();

                switch (fn) {
                    case 'cmd':
                        self.mathField.cmd(latex);
                        break;
                    case 'write':
                        self.mathField.write(latex);
                        break;
                }

                self.mathField.focus();
            });
        },


        /**
         * PCI public interface
         */

        id: -1,

        getTypeIdentifier: function () {
            return 'mathEntryInteraction';
        },
        /**
         * Render the PCI :
         * @param {String} id
         * @param {Node} dom
         * @param {Object} config - json
         */
        initialize: function (id, dom, config) {
            var self = this;

            event.addEventMgr(this);

            this.id = id;
            this.dom = dom;

            this.$container = $(dom);
            this.$toolbar = this.$container.find('.toolbar');
            this.$input = this.$container.find('.math-entry-input');

            this.render(config);

            //tell the rendering engine that I am ready
            qtiCustomInteractionContext.notifyReady(this);

            this.on('configChange', function (newConfig) {
                self.render(newConfig);
            });

            // render rich text content in prompt
            html.render(this.$container.find('.prompt'));
        },
        /**
         * Programmatically set the response following the json schema described in
         * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343
         *
         * @param {Object} interaction
         * @param {Object} response
         */
        setResponse: function (response) {
            if (response && response.base && response.base.string) {
                this.mathField.latex(response.base.string);
            }
        },
        /**
         * Get the response in the json format described in
         * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343
         *
         * @param {Object} interaction
         * @returns {Object}
         */
        getResponse: function() {
            return {
                base: {
                    string : this.mathField.latex()
                }
            };
        },
        /**
         * Remove the current response set in the interaction
         * The state may not be restored at this point.
         *
         * @param {Object} interaction
         */
        resetResponse: function () {
            this.mathField.latex('');
        },
        /**
         * Reverse operation performed by render()
         * After this function is executed, only the inital naked markup remains
         * Event listeners are removed and the state and the response are reset
         *
         * @param {Object} interaction
         */
        destroy: function () {
            this.$toolbar.off('mousedown.qtiCommonRenderer');
            this.resetResponse();
            this.mathField.revert();
        },
        /**
         * Restore the state of the interaction from the serializedState.
         *
         * @param {Object} interaction
         * @param {Object} state - json format
         */
        setSerializedState: function (state) {
            this.setResponse(state);
        },

        /**
         * Get the current state of the interaction as a string.
         * It enables saving the state for later usage.
         *
         * @param {Object} interaction
         * @returns {Object} json format
         */
        getSerializedState: function () {
            return this.getResponse();
        }
    };

    qtiCustomInteractionContext.register(mathEntryInteraction);
});