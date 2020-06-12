export default class HistoryRecord {
  /**
   * Create new history record from a DB instance
   * @return {HistoryRecord}
   */
  static fromDB({ from, to, count, createdAt }) {
    return new HistoryRecord(from, to, count, createdAt);
  }

  /**
   * @param {String} from
   * @param {String} to
   * @param {Number} count
   * @param {Number} createdAt
   */
  constructor(from, to, count, createdAt) {
    this._from = from;
    this._to = to;
    this._count = count;
    this._createdAt = createdAt;
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
