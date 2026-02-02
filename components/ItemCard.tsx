import React from 'react';
import { Item, ItemRarity, ItemType } from '../types';
import { Sword, Shield, Gem, Coins, Flame } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onEquip?: (item: Item) => void;
  onSell?: (item: Item) => void;
  isEquipped?: boolean;
}

const rarityColors = {
  [ItemRarity.COMMON]: 'border-slate-500 bg-slate-800 text-slate-300',
  [ItemRarity.RARE]: 'border-blue-500 bg-blue-900/20 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
  [ItemRarity.EPIC]: 'border-purple-500 bg-purple-900/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
  [ItemRarity.LEGENDARY]: 'border-amber-500 bg-amber-900/20 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse-slow',
  [ItemRarity.MYTHIC]: 'border-red-600 bg-red-950/40 text-red-100 shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse border-2',
};

const ItemCard: React.FC<ItemCardProps> = ({ item, onEquip, onSell, isEquipped }) => {
  const Icon = item.type === ItemType.WEAPON ? Sword : item.type === ItemType.ARMOR ? Shield : Gem;
  const isMythic = item.rarity === ItemRarity.MYTHIC;

  return (
    <div className={`relative p-3 rounded-lg border-2 flex flex-col gap-2 transition-transform hover:scale-[1.02] ${rarityColors[item.rarity]}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {isMythic ? <Flame size={18} className="text-red-500 animate-bounce" /> : <Icon size={18} />}
          <h4 className={`font-bold text-sm cinzel ${isMythic ? 'text-red-400 drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]' : ''}`}>
            {item.name}
          </h4>
        </div>
        {isEquipped && <span className="text-[10px] uppercase font-bold bg-green-900 text-green-300 px-1 rounded">Equipped</span>}
      </div>
      
      <p className="text-xs italic opacity-80 min-h-[2.5em]">{item.description}</p>
      
      <div className="grid grid-cols-2 gap-1 text-xs">
        {item.stats.attack && <span className="text-red-300">ATK +{item.stats.attack}</span>}
        {item.stats.defense && <span className="text-blue-300">DEF +{item.stats.defense}</span>}
        {item.stats.hpBonus && <span className="text-green-300">HP +{item.stats.hpBonus}</span>}
      </div>

      <div className="mt-auto flex justify-between items-center pt-2 border-t border-white/10">
        <span className="flex items-center gap-1 text-xs text-yellow-500">
            <Coins size={12} /> {item.value}
        </span>
        <div className="flex gap-2">
            {onEquip && !isEquipped && (
                <button 
                    onClick={() => onEquip(item)}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                >
                    Equip
                </button>
            )}
            {onSell && (
                <button 
                    onClick={() => onSell(item)}
                    className="px-2 py-1 bg-red-900/50 hover:bg-red-900/80 rounded text-xs font-bold text-red-200 transition-colors"
                >
                    Sell
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;