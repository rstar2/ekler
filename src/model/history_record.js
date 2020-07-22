export default class HistoryRecord {
  /**
   * Create new history record from a DB instance
   * @return {HistoryRecord}
   */
  static fromDB({ type, from, to, count, createdAt }) {
    return new HistoryRecord(type, from, to, count, createdAt);
  }

  /**
   * @param {String} type
   * @param {String} from
   * @param {String} to
   * @param {Number} count
   * @param {Number} createdAt
   */
  constructor(type, from, to, count, createdAt) {
    this._type = type;
    this._from = from;
    this._to = to;
    this._count = count;
    this._createdAt = createdAt;
  }

  /**
   * @return {String}
   */
  get type() {
    return this._type;
  }

  /**
   * @return {String}
   */
  get from() {
    return this._from;
  }

  /**
   * @return {String}
   */
  get to() {
    return this._to;
  }

  /**
   * @return {Number}
   */
  get count() {
    return this._count;
  }

  /**
   * @return {Number}
   */
  get createdAt() {
    return this._createdAt;
  }
}
