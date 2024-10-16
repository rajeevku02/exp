from torch.utils.data import DataLoader, Dataset
import torch
from config import config

class GPTDataset(Dataset):
    def __init__(self, text, sequence_len, stride):
        self.input_ids = []
        self.target_ids = []
        token_ids = config.tokenizer.encode(text, allowed_special={"<|endoftext|>"})
        for i in range(0, len(token_ids) - sequence_len, stride):
            inp = token_ids[i: i+sequence_len]
            target = token_ids[i+1: i+sequence_len+1]
            self.input_ids.append(torch.tensor(inp).to(config.device))
            self.target_ids.append(torch.tensor(target).to(config.device))

    def __len__(self):
        return len(self.input_ids)

    def __getitem__(self, idx):
        return self.input_ids[idx], self.target_ids[idx]

def create_dataloader(text, config, shuffle=True, drop_last=True, num_workers=0):
    dataset = GPTDataset(text, config.max_sequence_len, config.stride)
    dataloader = DataLoader(dataset, batch_size=config.batch_size, shuffle=shuffle, drop_last=drop_last, num_workers=num_workers)
    return dataloader

def create_verdict_dataloader(config):
    with open('./data/the-verdict.txt') as file:
        text = file.read()
    return create_dataloader(text, config)
