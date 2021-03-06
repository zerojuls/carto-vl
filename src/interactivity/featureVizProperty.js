import { blend, property, transition, notEquals } from '../renderer/viz/expressions';
import { parseVizExpression } from '../renderer/viz/parser';

/**
 *
 * FeatureVizProperty objects can be accessed through {@link Feature} objects.
 *
 * @typedef {object} FeatureVizProperty
 * @property {function} blendTo - Change the feature viz by blending to a destination viz expression `expr` in `duration` milliseconds, where `expr` is the first parameter and `duration` the last one
 * @property {function} reset - Reset custom feature viz property by fading out `duration` milliseconds, where `duration` is the first parameter to reset
 * @property {function} value - Getter that evaluates the property and returns the computed value
 * @api
 */
export default class FeatureVizProperty {
    get value() {
        return this._viz[this._propertyName].eval(this._properties);
    }

    constructor(propertyName, feature, viz, customizedFeatures, trackFeatureViz, idProperty) {
        this._propertyName = propertyName;
        this._feature = feature;
        this._viz = viz;
        this._properties = this._feature.properties;

        this.blendTo = _generateBlenderFunction(propertyName, feature, customizedFeatures, viz, trackFeatureViz, idProperty);
        this.reset = _generateResetFunction(propertyName, feature, customizedFeatures, viz, idProperty);
    }
}

function _generateResetFunction(propertyName, feature, customizedFeatures, viz, idProperty) {
    return function reset(duration = 500) {
        if (customizedFeatures[feature.id] && customizedFeatures[feature.id][propertyName]) {
            customizedFeatures[feature.id][propertyName].replaceChild(
                customizedFeatures[feature.id][propertyName].mix,
                // transition(0) is used to ensure that blend._predraw() "GC" collects it
                blend(notEquals(property(idProperty), feature.id), transition(0), transition(duration))
            );
            viz[propertyName].notify();
            customizedFeatures[feature.id][propertyName] = undefined;
        }
    };
}


function _generateBlenderFunction(propertyName, feature, customizedFeatures, viz, trackFeatureViz, idProperty) {
    return function generatedBlendTo(newExpression, duration = 500) {
        if (typeof newExpression == 'string') {
            newExpression = parseVizExpression(newExpression);
        }
        if (customizedFeatures[feature.id] && customizedFeatures[feature.id][propertyName]) {
            customizedFeatures[feature.id][propertyName].a.blendTo(newExpression, duration);
            return;
        }
        const blendExpr = blend(
            newExpression,
            viz[propertyName],
            blend(1, notEquals(property(idProperty), feature.id), transition(duration))
        );
        trackFeatureViz(feature.id, propertyName, blendExpr, customizedFeatures);
        viz.replaceChild(
            viz[propertyName],
            blendExpr,
        );
        viz[propertyName].notify();
    };
}
