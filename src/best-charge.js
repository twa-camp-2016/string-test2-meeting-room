let loadAllItems = require('./items');
let loadPromotions = require('./promotions');

function bestCharge(selectedItems) {
  let countedIds = countIds(selectedItems);
  let allItems = loadAllItems();
  let cartItems = buildCartItems(countedIds, allItems);
  let promotions = loadPromotions();
  let promotedItems = buildPromotions(cartItems, promotions);
  let totalPrice = calculateTotalPrices(promotedItems);

  let chosenTypePrice = chooseType(totalPrice, promotions);
  let receipt = buildReceipt(promotedItems, chosenTypePrice);
  let receiptString = buildReceiptString(receipt);

  return receiptString;
}

function countIds(tags) {
  return tags.map((tag) => {
    let [id,count] = tag.split(' x ');
    return {id, count: parseFloat(count)};
  });
}

function _getExistElementByIds(array, id) {
  return array.find((element) => element.id === id);
}

function buildCartItems(countedIds, allItems) {
  return countedIds.map(({id, count}) => {
    let {name, price} = _getExistElementByIds(allItems, id);
    return {id, name, price, count};
  })
}

function buildPromotions(cartItems, promotions) {
  let halfPrice = promotions.find((promotion) => promotion.type === '指定菜品半价');
  return cartItems.map((cartItem) => {
    let hasHalf = halfPrice.items.includes(cartItem.id);
    let saved = hasHalf ? cartItem.price / 2 * cartItem.count : 0;
    let payPrice = cartItem.price * cartItem.count - saved;
    return Object.assign({}, cartItem, {
      payPrice, saved
    });
  });
}

function calculateTotalPrices(promotedItems) {
  return promotedItems.reduce((result, promotedItem)=> {
    debugger;
    result.totalPayPrice += promotedItem.payPrice;
    result.totalSaved += promotedItem.saved;
    return result;
  }, {totalPayPrice: 0, totalSaved: 0})
}

function chooseType({totalPayPrice, totalSaved}, promotions) {
  let total = totalPayPrice + totalSaved;
  let reachPromotion = total >= 30 ? 6 : 0;
  let reachPromotionString = promotions.find((promotion) => promotion.type === '满30减6元').type;
  let halfPriceString = promotions.find((promotion) => promotion.type === '指定菜品半价').type;
  if (reachPromotion === 0) {
    return {
      totalPayPrice: totalPayPrice,
      totalSaved: totalSaved,
      chosenType: ''
    }
  } else if (reachPromotion > totalSaved) {
    return {
      totalPayPrice: totalPayPrice + totalSaved - 6,
      totalSaved: 6,
      chosenType: reachPromotionString
    }
  } else {
    return {
      totalPayPrice: totalPayPrice,
      totalSaved: totalSaved,
      chosenType: halfPriceString
    }
  }

}

function buildReceipt(promotedItems, {totalPayPrice, totalSaved, chosenType}) {
  let receiptArray = [];
  for (let promotedItem of promotedItems) {
    receiptArray.push({
      name: promotedItem.name,
      price: promotedItem.price,
      count: promotedItem.count,
      payPrice: promotedItem.payPrice,
      saved: promotedItem.saved
    });
  }
  return {receiptItems: receiptArray, totalPayPrice, totalSaved, chosenType};
}

function buildReceiptString(receipt) {
  let lines = ['============= 订餐明细 ============='];
  for ({name, count, price} of receipt.receiptItems) {
    let line = `${name} x ${count} = ${count * price}元`;
    lines.push(line);
  }
  if (receipt.totalSaved > 0) {
    lines.push('-----------------------------------');
    lines.push('使用优惠:');
    if(receipt.chosenType==='指定菜品半价'){
      let halfItemsName = receipt.receiptItems.filter(({saved})=>saved > 0).map(({name})=>name);
      lines.push(`指定菜品半价(${halfItemsName.join('，')})，省${receipt.totalSaved}元`);
    }else {
      lines.push(`满30减6元，省${receipt.totalSaved}元`);
    }
  }
  lines.push('-----------------------------------');
  lines.push(`总计：${receipt.totalPayPrice}元`);
  lines.push('===================================');
  let receiptString=lines.join('\n');
  require('fs').writeFileSync('1.txt',receiptString);
  return receiptString;
}

module.exports = {
  bestCharge, buildReceipt, chooseType, calculateTotalPrices, buildPromotions, buildCartItems, countIds
}
